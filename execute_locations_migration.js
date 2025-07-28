
const { Pool } = require('pg');

async function executeLocationsMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚀 Starting Locations New Module Migration...');
    
    // Read and execute the migration file
    const fs = require('fs');
    const path = require('path');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'server/database/migrations/create_locations_new_tables.sql'), 
      'utf8'
    );
    
    console.log('📝 Executing migration SQL...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const verificationQuery = `
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname LIKE 'tenant_%' 
        AND tablename IN ('locais', 'regioes', 'rotas_dinamicas', 'trechos', 'rotas_trecho', 'areas', 'agrupamentos')
      ORDER BY schemaname, tablename;
    `;
    
    const result = await pool.query(verificationQuery);
    
    console.log('📋 Created tables verification:');
    console.table(result.rows);
    
    console.log(`🎉 Successfully created ${result.rows.length} tables across tenant schemas!`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  executeLocationsMigration();
}

module.exports = executeLocationsMigration;
