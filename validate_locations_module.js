
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

async function validateLocationsModule() {
  console.log('🔍 Validando módulo de locais completo...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get all tenant schemas
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

    let allTablesExist = true;
    let totalRecords = 0;

    for (const schema of tenantSchemas) {
      console.log(`🏢 Validando schema: ${schema}`);
      
      for (const table of requiredTables) {
        try {
          // Check if table exists
          const tableCheck = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = $1 AND table_name = $2
            )
          `, [schema, table]);

          if (!tableCheck.rows[0].exists) {
            console.log(`  ❌ Tabela ${table} não existe`);
            allTablesExist = false;
            continue;
          }

          // Count records
          const countResult = await pool.query(`
            SELECT COUNT(*) as count FROM "${schema}"."${table}"
          `);
          
          const count = parseInt(countResult.rows[0].count);
          totalRecords += count;
          
          console.log(`  ✅ ${table}: ${count} registros`);
          
        } catch (error) {
          console.log(`  ❌ Erro ao validar ${table}: ${error.message}`);
          allTablesExist = false;
        }
      }
      console.log('');
    }

    console.log(`📈 RESUMO DA VALIDAÇÃO:`);
    console.log(`- Schemas validados: ${tenantSchemas.length}`);
    console.log(`- Tabelas requeridas: ${requiredTables.length}`);
    console.log(`- Total de registros: ${totalRecords}`);
    console.log(`- Status: ${allTablesExist ? '✅ TODAS AS TABELAS EXISTEM' : '❌ TABELAS FALTANTES DETECTADAS'}`);

    // Test a sample query for each table type
    console.log('\n🧪 TESTANDO CONSULTAS DE EXEMPLO:\n');
    
    const sampleSchema = tenantSchemas[0];
    const sampleTenantId = sampleSchema.replace('tenant_', '').replace(/_/g, '-');
    
    for (const table of requiredTables) {
      try {
        const sampleQuery = await pool.query(`
          SELECT * FROM "${sampleSchema}"."${table}" 
          WHERE tenant_id = $1 
          LIMIT 1
        `, [sampleTenantId]);
        
        console.log(`  ✅ ${table}: Query executada com sucesso`);
      } catch (error) {
        console.log(`  ❌ ${table}: Erro na query - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro na validação:', error);
  } finally {
    await pool.end();
  }
}

validateLocationsModule().catch(console.error);
