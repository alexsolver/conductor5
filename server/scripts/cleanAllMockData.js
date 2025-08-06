
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanAllMockData() {
  console.log('🧹 LIMPEZA COMPLETA DE DADOS MOCK');
  console.log('=====================================');
  
  try {
    // 1. Obter todos os tenants
    const tenantsResult = await pool.query('SELECT id FROM public.tenants');
    const tenants = tenantsResult.rows;
    
    console.log(`📊 Encontrados ${tenants.length} tenants para limpeza`);
    
    let totalMockRecords = 0;
    
    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      console.log(`\n🏢 Limpando tenant: ${tenantId}`);
      
      // Tabelas para limpeza de dados mock
      const tablesToClean = [
        'items',
        'suppliers',
        'customers',
        'customer_item_mappings',
        'item_supplier_links',
        'locations',
        'areas',
        'regions'
      ];
      
      for (const table of tablesToClean) {
        try {
          // Verificar se a tabela existe
          const tableExists = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = $1 AND table_name = $2
            )
          `, [schemaName, table]);
          
          if (!tableExists.rows[0].exists) {
            console.log(`  ⏭️  Tabela ${table} não existe, pulando...`);
            continue;
          }
          
          // Remover registros mock
          let mockQuery;
          
          if (table === 'items') {
            mockQuery = `
              DELETE FROM "${schemaName}"."${table}"
              WHERE id::text LIKE 'mock-%' 
                 OR name LIKE '%Mock%' 
                 OR name LIKE '%Test%' 
                 OR name LIKE '%Exemplo%'
                 OR description LIKE '%mock%'
                 OR description LIKE '%test%'
            `;
          } else if (table === 'suppliers') {
            mockQuery = `
              DELETE FROM "${schemaName}"."${table}"
              WHERE id::text LIKE 'mock-%' 
                 OR company_name LIKE '%Mock%' 
                 OR company_name LIKE '%Test%' 
                 OR company_name LIKE '%Exemplo%'
                 OR email LIKE '%mock%'
                 OR email LIKE '%test%'
            `;
          } else if (table === 'customers') {
            mockQuery = `
              DELETE FROM "${schemaName}"."${table}"
              WHERE id::text LIKE 'mock-%' 
                 OR display_name LIKE '%Mock%' 
                 OR display_name LIKE '%Test%' 
                 OR display_name LIKE '%Exemplo%'
                 OR email LIKE '%mock%'
                 OR email LIKE '%test%'
            `;
          } else {
            // Para outras tabelas
            mockQuery = `
              DELETE FROM "${schemaName}"."${table}"
              WHERE id::text LIKE 'mock-%' 
                 OR (nome IS NOT NULL AND (nome LIKE '%Mock%' OR nome LIKE '%Test%' OR nome LIKE '%Exemplo%'))
            `;
          }
          
          const deleteResult = await pool.query(mockQuery);
          const deletedCount = deleteResult.rowCount || 0;
          
          if (deletedCount > 0) {
            console.log(`  🗑️  ${table}: removidos ${deletedCount} registros mock`);
            totalMockRecords += deletedCount;
          } else {
            console.log(`  ✅ ${table}: nenhum dado mock encontrado`);
          }
          
        } catch (error) {
          console.log(`  ❌ Erro ao limpar ${table}: ${error.message}`);
        }
      }
    }
    
    // 2. Limpar tabelas públicas também
    console.log('\n🌐 Limpando tabelas públicas...');
    
    const publicTables = ['sessions', 'tenants'];
    
    for (const table of publicTables) {
      try {
        const mockQuery = `
          DELETE FROM public."${table}"
          WHERE id::text LIKE 'mock-%' 
             OR (name IS NOT NULL AND (name LIKE '%Mock%' OR name LIKE '%Test%'))
        `;
        
        const deleteResult = await pool.query(mockQuery);
        const deletedCount = deleteResult.rowCount || 0;
        
        if (deletedCount > 0) {
          console.log(`  🗑️  ${table}: removidos ${deletedCount} registros mock`);
          totalMockRecords += deletedCount;
        } else {
          console.log(`  ✅ ${table}: nenhum dado mock encontrado`);
        }
      } catch (error) {
        console.log(`  ❌ Erro ao limpar ${table}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 LIMPEZA COMPLETA FINALIZADA!');
    console.log('================================');
    console.log(`📊 Total de registros mock removidos: ${totalMockRecords}`);
    console.log('✅ Banco de dados limpo e pronto para dados reais');
    
  } catch (error) {
    console.error('❌ Erro na limpeza de dados mock:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanAllMockData();
}

export { cleanAllMockData };
