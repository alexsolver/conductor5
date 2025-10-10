import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncAllTenants() {
  console.log('🚀 Starting tenant schema synchronization...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    // Get all tenants
    const tenantsResult = await pool.query('SELECT id, name FROM public.tenants ORDER BY name');
    const tenants = tenantsResult.rows;
    
    console.log(`📊 Found ${tenants.length} tenants to synchronize\n`);

    // Read the main tenant migration SQL
    const migrationPath = path.join(__dirname, 'pg-migrations', 'tenant', '001_create_tenant_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    let successCount = 0;
    let errorCount = 0;
    const errors: { tenant: string; error: any }[] = [];

    // Process each tenant
    for (const tenant of tenants) {
      const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
      
      try {
        console.log(`\n📦 Processing: ${tenant.name} (${schemaName})`);
        
        // Create schema if not exists
        await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        
        // Set search path
        await pool.query(`SET search_path TO "${schemaName}", public`);
        
        // Count tables before
        const beforeCount = await pool.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = $1
        `, [schemaName]);
        
        console.log(`  Tables before: ${beforeCount.rows[0].count}`);
        
        // Execute migration SQL
        await pool.query(migrationSQL);
        
        // Count tables after
        const afterCount = await pool.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = $1
        `, [schemaName]);
        
        console.log(`  Tables after: ${afterCount.rows[0].count}`);
        console.log(`  ✅ Synchronized successfully`);
        
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({ tenant: tenant.name, error });
        console.error(`  ❌ Error: ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNCHRONIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tenants: ${tenants.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 Errors:');
      errors.forEach(({ tenant, error }) => {
        console.log(`  - ${tenant}: ${error.message}`);
      });
    }
    
    console.log('\n✨ Synchronization completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute
syncAllTenants()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
