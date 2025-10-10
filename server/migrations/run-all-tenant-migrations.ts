import { Pool } from 'pg';
import { MigrationManager } from './pg-migrations/config/migration-manager.js';

async function runAllTenantMigrations() {
  console.log('🚀 Starting migration process for all tenants...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    // Get all tenants
    const tenantsResult = await pool.query('SELECT id, name FROM public.tenants ORDER BY name');
    const tenants = tenantsResult.rows;
    
    console.log(`📊 Found ${tenants.length} tenants to migrate\n`);

    const migrationManager = new MigrationManager();
    
    let successCount = 0;
    let errorCount = 0;
    const errors: { tenant: string; error: any }[] = [];

    // Run migrations for each tenant
    for (const tenant of tenants) {
      try {
        console.log(`\n📦 Processing tenant: ${tenant.name} (${tenant.id})`);
        await migrationManager.runTenantMigrations(tenant.id);
        successCount++;
        console.log(`✅ Successfully migrated tenant: ${tenant.name}`);
      } catch (error) {
        errorCount++;
        errors.push({ tenant: tenant.name, error });
        console.error(`❌ Error migrating tenant ${tenant.name}:`, error);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tenants: ${tenants.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 Errors encountered:');
      errors.forEach(({ tenant, error }) => {
        console.log(`  - ${tenant}: ${error.message}`);
      });
    }
    
    console.log('\n✨ Migration process completed!');

  } catch (error) {
    console.error('❌ Fatal error during migration process:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
runAllTenantMigrations()
  .then(() => {
    console.log('\n✅ All migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
