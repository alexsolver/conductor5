
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function validateLocationsFinal() {
  console.log('🔍 Validação Final do Módulo de Locais...\n');

  try {
    // Obter todos os schemas de tenant
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📊 Encontrados ${tenantSchemas.length} schemas de tenant\n`);

    const requiredTables = [
      'locais', 'regioes', 'rotas_dinamicas', 'trechos', 
      'rotas_trecho', 'trechos_rota', 'areas', 'agrupamentos'
    ];

    let totalRecords = 0;
    let allTablesExist = true;
    let mockDataFound = false;

    for (const schema of tenantSchemas) {
      console.log(`🏢 Validando schema: ${schema}`);
      
      for (const table of requiredTables) {
        try {
          // Verificar se a tabela existe
          const tableCheck = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = $1 AND table_name = $2
            )
          `, [schema, table]);

          if (!tableCheck.rows[0].exists) {
            console.log(`  ❌ Tabela ausente: ${table}`);
            allTablesExist = false;
            continue;
          }

          // Contar registros
          const countResult = await pool.query(`
            SELECT COUNT(*) as total FROM "${schema}"."${table}"
          `);
          const count = parseInt(countResult.rows[0].total);
          totalRecords += count;

          // Verificar dados mock
          const mockCheckResult = await pool.query(`
            SELECT COUNT(*) as mock_count FROM "${schema}"."${table}"
            WHERE (nome LIKE '%mock%' OR nome LIKE '%test%' OR nome LIKE '%exemplo%')
               OR (nome_rota LIKE '%mock%' OR nome_rota LIKE '%test%' OR nome_rota LIKE '%exemplo%')
          `);
          const mockCount = parseInt(mockCheckResult.rows[0].mock_count);
          
          if (mockCount > 0) {
            mockDataFound = true;
            console.log(`  ⚠️  ${table}: ${count} registros (${mockCount} mock)`);
          } else {
            console.log(`  ✅ ${table}: ${count} registros`);
          }

        } catch (error) {
          console.log(`  ❌ Erro verificando ${table}: ${error.message}`);
          allTablesExist = false;
        }
      }
    }

    console.log('\n📈 RESUMO DA VALIDAÇÃO:');
    console.log(`- Schemas validados: ${tenantSchemas.length}`);
    console.log(`- Tabelas obrigatórias: ${requiredTables.length}`);
    console.log(`- Total de registros: ${totalRecords}`);
    console.log(`- Todas as tabelas existem: ${allTablesExist ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`- Dados mock encontrados: ${mockDataFound ? '⚠️ SIM' : '✅ NÃO'}`);

    console.log('\n🧪 TESTANDO QUERIES DE EXEMPLO:');
    const testTenant = 'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e';
    
    for (const table of requiredTables) {
      try {
        const testResult = await pool.query(`
          SELECT COUNT(*) as count FROM "${testTenant}"."${table}"
          LIMIT 1
        `);
        console.log(`  ✅ ${table}: Query bem-sucedida`);
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }

    console.log('\n✅ Validação final concluída!');
    
    if (!allTablesExist) {
      console.log('\n⚠️ AÇÕES NECESSÁRIAS:');
      console.log('- Executar migração para criar tabelas ausentes');
    }
    
    if (mockDataFound) {
      console.log('- Limpar dados mock do banco de dados');
    }

    if (allTablesExist && !mockDataFound) {
      console.log('\n🎉 MÓDULO DE LOCAIS TOTALMENTE FUNCIONAL!');
      console.log('- Todas as tabelas existem');
      console.log('- Apenas dados reais no banco');
      console.log('- Sistema pronto para produção');
    }

  } catch (error) {
    console.error('❌ Erro na validação:', error);
  } finally {
    await pool.end();
  }
}

validateLocationsFinal();
