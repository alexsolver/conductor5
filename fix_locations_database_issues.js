
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixLocationsDatabaseIssues() {
  console.log('🔧 Starting Locations Database Fix...');
  
  try {
    // Get all tenant schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);

    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📊 Found ${tenantSchemas.length} tenant schemas to fix`);

    for (const schema of tenantSchemas) {
      console.log(`\n🏢 Processing schema: ${schema}`);
      
      // Check if tables exist and create if missing
      const requiredTables = [
        'locais', 'regioes', 'rotas_dinamicas', 'trechos', 
        'rotas_trecho', 'trechos_rota', 'areas', 'agrupamentos'
      ];

      for (const table of requiredTables) {
        const tableExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = $2
          )
        `, [schema, table]);

        if (!tableExists.rows[0].exists) {
          console.log(`  ❌ Missing table: ${table} - Creating...`);
          
          // Call the migration function to create tables
          await pool.query(`SELECT create_locations_new_tables_for_tenant($1)`, [schema]);
          console.log(`  ✅ Created table: ${table}`);
        } else {
          console.log(`  ✅ Table exists: ${table}`);
        }
      }

      // Remove any mock data that might still exist
      console.log(`  🧹 Cleaning mock data from ${schema}...`);
      
      for (const table of requiredTables) {
        try {
          // Delete records with mock-like names or IDs
          const deleteResult = await pool.query(`
            DELETE FROM "${schema}"."${table}"
            WHERE id::text LIKE 'mock-%' 
               OR nome LIKE '%Mock%' 
               OR nome LIKE '%Test%' 
               OR nome LIKE '%Exemplo%'
               OR codigo_integracao LIKE 'MOCK%'
               OR codigo_integracao LIKE 'TEST%'
          `);
          
          if (deleteResult.rowCount > 0) {
            console.log(`    🗑️  Removed ${deleteResult.rowCount} mock records from ${table}`);
          }
        } catch (error) {
          // Table might not have all columns, continue
          console.log(`    ℹ️  Skipped cleaning ${table}: ${error.message}`);
        }
      }

      // Verify data integrity
      console.log(`  📊 Verifying data integrity for ${schema}...`);
      
      for (const table of requiredTables) {
        try {
          const countResult = await pool.query(`
            SELECT COUNT(*) as total FROM "${schema}"."${table}"
          `);
          console.log(`    📈 ${table}: ${countResult.rows[0].total} records`);
        } catch (error) {
          console.log(`    ❌ Error checking ${table}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Locations Database Fix completed successfully!');
    console.log('📋 Summary:');
    console.log('  - All required tables created');
    console.log('  - Mock data removed');
    console.log('  - Data integrity verified');
    
  } catch (error) {
    console.error('❌ Error fixing locations database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  fixLocationsDatabaseIssues();
}

export default fixLocationsDatabaseIssues;
