
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanupAllMockDataComplete() {
  console.log('🧹 LIMPEZA COMPLETA E DEFINITIVA DE TODOS OS MOCK DATA');
  console.log('======================================================');
  
  try {
    let totalMockRecords = 0;
    
    // 1. LIMPEZA DO BANCO DE DADOS
    console.log('\n📊 1. LIMPANDO BANCO DE DADOS...');
    
    // Obter todos os tenants
    const tenantsResult = await pool.query('SELECT id FROM public.tenants');
    const tenants = tenantsResult.rows;
    
    console.log(`   Encontrados ${tenants.length} tenants para limpeza`);
    
    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      console.log(`   🏢 Limpando tenant: ${tenantId}`);
      
      // Tabelas críticas para limpeza
      const criticalTables = [
        'items', 'suppliers', 'customers', 'customer_item_mappings', 
        'item_supplier_links', 'locations', 'areas', 'regions',
        'locais', 'regioes', 'rotas_dinamicas', 'trechos', 
        'rotas_trecho', 'trechos_rota', 'agrupamentos',
        'tickets', 'users', 'companies', 'beneficiaries'
      ];
      
      for (const table of criticalTables) {
        try {
          // Verificar se a tabela existe
          const tableExists = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = $1 AND table_name = $2
            )
          `, [schemaName, table]);
          
          if (!tableExists.rows[0].exists) continue;
          
          // Query de limpeza expandida
          const mockQuery = `
            DELETE FROM "${schemaName}"."${table}"
            WHERE id::text LIKE 'mock-%' 
               OR id::text LIKE 'test-%'
               OR id::text LIKE 'demo-%'
               OR id::text LIKE 'temp-%'
               OR id::text LIKE 'fake-%'
               OR (name IS NOT NULL AND (name LIKE '%Mock%' OR name LIKE '%Test%' OR name LIKE '%Demo%' OR name LIKE '%Fake%' OR name LIKE '%Temp%'))
               OR (nome IS NOT NULL AND (nome LIKE '%Mock%' OR nome LIKE '%Test%' OR nome LIKE '%Demo%' OR nome LIKE '%Fake%' OR nome LIKE '%Temp%' OR nome LIKE '%Exemplo%'))
               OR (display_name IS NOT NULL AND (display_name LIKE '%Mock%' OR display_name LIKE '%Test%' OR display_name LIKE '%Demo%'))
               OR (company_name IS NOT NULL AND (company_name LIKE '%Mock%' OR company_name LIKE '%Test%' OR company_name LIKE '%Demo%'))
               OR (email IS NOT NULL AND (email LIKE '%mock%' OR email LIKE '%test%' OR email LIKE '%demo%' OR email LIKE '%fake%'))
               OR (codigo_integracao IS NOT NULL AND (codigo_integracao LIKE 'MOCK%' OR codigo_integracao LIKE 'TEST%' OR codigo_integracao LIKE 'DEMO%' OR codigo_integracao LIKE 'TEMP%'))
               OR (description IS NOT NULL AND (description LIKE '%mock%' OR description LIKE '%test%' OR description LIKE '%demo%' OR description LIKE '%fake%'))
          `;
          
          const deleteResult = await pool.query(mockQuery);
          const deletedCount = deleteResult.rowCount || 0;
          
          if (deletedCount > 0) {
            console.log(`      🗑️  ${table}: removidos ${deletedCount} registros mock`);
            totalMockRecords += deletedCount;
          }
          
        } catch (error) {
          console.log(`      ⚠️  Erro ao limpar ${table}: ${error.message}`);
        }
      }
    }
    
    // 2. LIMPEZA DE ARQUIVOS DE CÓDIGO
    console.log('\n💻 2. ESCANEANDO ARQUIVOS DE CÓDIGO...');
    
    const mockFiles = [];
    
    // Função para escanear arquivos
    function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath, extensions);
        } else if (extensions.some(ext => file.endsWith(ext))) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Padrões de mock data em código
            const mockPatterns = [
              /mockItems|mockData|fakeData|testData/gi,
              /mock.*=.*\[/gi,
              /const.*mock.*=/gi,
              /Mock.*Framework/gi,
              /lorem ipsum/gi,
              /\.mockImplementation/gi,
              /\.mockReturnValue/gi
            ];
            
            let hasMockData = false;
            mockPatterns.forEach(pattern => {
              if (pattern.test(content)) {
                hasMockData = true;
              }
            });
            
            if (hasMockData) {
              mockFiles.push(filePath);
            }
          } catch (error) {
            // Ignorar erros de leitura
          }
        }
      });
    }
    
    // Escanear client e server
    scanDirectory('./client/src');
    scanDirectory('./server');
    
    console.log(`   📁 Encontrados ${mockFiles.length} arquivos com possível mock data:`);
    mockFiles.slice(0, 10).forEach(file => {
      console.log(`      📄 ${file}`);
    });
    if (mockFiles.length > 10) {
      console.log(`      ... e mais ${mockFiles.length - 10} arquivos`);
    }
    
    // 3. VERIFICAÇÃO DE INTEGRIDADE
    console.log('\n🔍 3. VERIFICAÇÃO FINAL...');
    
    // Contar registros restantes com padrões suspeitos
    let remainingMockCount = 0;
    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      try {
        const checkResult = await pool.query(`
          SELECT 
            (SELECT COUNT(*) FROM "${schemaName}".items WHERE name LIKE '%Mock%' OR name LIKE '%Test%' OR name LIKE '%Demo%') +
            (SELECT COUNT(*) FROM "${schemaName}".customers WHERE display_name LIKE '%Mock%' OR display_name LIKE '%Test%' OR email LIKE '%mock%') +
            (SELECT COUNT(*) FROM "${schemaName}".suppliers WHERE company_name LIKE '%Mock%' OR company_name LIKE '%Test%' OR email LIKE '%mock%') +
            (SELECT COUNT(*) FROM "${schemaName}".locations WHERE nome LIKE '%Mock%' OR nome LIKE '%Test%') as total_remaining
        `);
        
        remainingMockCount += parseInt(checkResult.rows[0]?.total_remaining || 0);
      } catch (error) {
        // Schema pode não existir
      }
    }
    
    console.log('\n🎉 LIMPEZA COMPLETA FINALIZADA!');
    console.log('================================');
    console.log(`📊 Total de registros mock removidos: ${totalMockRecords}`);
    console.log(`📁 Arquivos de código com mock data: ${mockFiles.length}`);
    console.log(`🔍 Registros suspeitos restantes: ${remainingMockCount}`);
    
    if (remainingMockCount === 0 && mockFiles.length === 0) {
      console.log('✅ SISTEMA COMPLETAMENTE LIMPO - PRONTO PARA PRODUÇÃO!');
    } else {
      console.log('⚠️  Ainda existem alguns padrões mock que requerem atenção manual');
    }
    
    // Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      mockRecordsRemoved: totalMockRecords,
      mockFilesFound: mockFiles.length,
      remainingMockCount: remainingMockCount,
      filesWithMockData: mockFiles,
      status: remainingMockCount === 0 && mockFiles.length === 0 ? 'CLEAN' : 'NEEDS_ATTENTION'
    };
    
    fs.writeFileSync('./mock_data_cleanup_report.json', JSON.stringify(report, null, 2));
    console.log('📋 Relatório salvo em: mock_data_cleanup_report.json');
    
  } catch (error) {
    console.error('❌ Erro na limpeza completa:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupAllMockDataComplete();
}

export { cleanupAllMockDataComplete };
