
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function validateLocationsComplete() {
  console.log('🔍 Starting Complete Locations Module Validation...\n');

  try {
    // Get all tenant schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📊 Found ${tenantSchemas.length} tenant schemas\n`);

    const requiredTables = [
      'locais', 'regioes', 'rotas_dinamicas', 'trechos', 
      'rotas_trecho', 'trechos_rota', 'areas', 'agrupamentos'
    ];

    let totalRecords = 0;
    let allTablesExist = true;
    let mockDataFound = false;

    for (const schema of tenantSchemas) {
      console.log(`🏢 Validating schema: ${schema}`);
      
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
            console.log(`  ❌ Missing table: ${table}`);
            allTablesExist = false;
            continue;
          }

          // Count records
          const countResult = await pool.query(`
            SELECT COUNT(*) as total FROM "${schema}"."${table}"
          `);
          const count = parseInt(countResult.rows[0].total);
          totalRecords += count;

          // Check for mock data
          const mockCheck = await pool.query(`
            SELECT COUNT(*) as mock_count FROM "${schema}"."${table}"
            WHERE id::text LIKE 'mock-%' 
               OR nome LIKE '%Mock%' 
               OR nome LIKE '%Test%' 
               OR nome LIKE '%Exemplo%'
               OR codigo_integracao LIKE 'MOCK%'
               OR codigo_integracao LIKE 'TEST%'
          `);
          
          const mockCount = parseInt(mockCheck.rows[0].mock_count || 0);
          if (mockCount > 0) {
            mockDataFound = true;
            console.log(`  ⚠️  ${table}: ${count} records (${mockCount} mock)`);
          } else {
            console.log(`  ✅ ${table}: ${count} records`);
          }

        } catch (error) {
          console.log(`  ❌ Error checking ${table}: ${error.message}`);
        }
      }
    }

    // Final report
    console.log('\n📈 VALIDATION SUMMARY:');
    console.log(`- Schemas validated: ${tenantSchemas.length}`);
    console.log(`- Tables required: ${requiredTables.length}`);
    console.log(`- Total records: ${totalRecords}`);
    console.log(`- All tables exist: ${allTablesExist ? '✅ YES' : '❌ NO'}`);
    console.log(`- Mock data found: ${mockDataFound ? '⚠️  YES' : '✅ NO'}`);

    // Test sample queries
    console.log('\n🧪 TESTING SAMPLE QUERIES:');
    
    const sampleSchema = tenantSchemas[0];
    if (sampleSchema) {
      for (const table of requiredTables) {
        try {
          await pool.query(`SELECT * FROM "${sampleSchema}"."${table}" LIMIT 1`);
          console.log(`  ✅ ${table}: Query successful`);
        } catch (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Complete validation finished!');
    
    if (!allTablesExist || mockDataFound) {
      console.log('\n⚠️  ACTIONS NEEDED:');
      if (!allTablesExist) {
        console.log('- Run migration to create missing tables');
      }
      if (mockDataFound) {
        console.log('- Clean mock data from database');
      }
    } else {
      console.log('\n🎉 All systems operational - no issues found!');
    }

  } catch (error) {
    console.error('❌ Validation error:', error);
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateLocationsComplete();
}

export default validateLocationsComplete;
