#!/usr/bin/env tsx

import { MigrationManager } from '../migrations/pg-migrations/config/migration-manager';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const tenantId = args[1];

  console.log('🔧 [PG-MIGRATIONS] Starting migration process...');
  console.log(`📋 Command: ${command}`);
  if (tenantId) {
    console.log(`🏢 Tenant ID: ${tenantId}`);
  }

  const migrationManager = new MigrationManager();

  try {
    await migrationManager.createMigrationTable();

    switch (command) {
      case 'public':
        console.log('🏗️  Running public schema migrations...');
        await migrationManager.runPublicMigrations();
        console.log('✅ Public schema migrations completed!');
        break;

      case 'tenant':
        if (!tenantId) {
          console.error('❌ Error: Tenant ID is required for tenant migrations');
          console.log('Usage: tsx run-migrations.ts tenant <tenant-id>');
          process.exit(1);
        }
        console.log(`🏗️  Running tenant migrations for: ${tenantId}`);
        await migrationManager.runTenantMigrations(tenantId);
        console.log(`✅ Tenant migrations completed for: ${tenantId}`);
        break;

      case 'setup':
        console.log('🏗️  Setting up complete system...');
        await migrationManager.runPublicMigrations();
        console.log('✅ Public schema setup completed!');
        console.log('ℹ️  Note: Run tenant migrations separately for each tenant');
        break;

      default:
        console.log('🔧 PG-MIGRATIONS Usage:');
        console.log('');
        console.log('Commands:');
        console.log('  public              - Run public schema migrations');
        console.log('  tenant <tenant-id>  - Run tenant schema migrations');
        console.log('  setup               - Setup public schema (initial setup)');
        console.log('');
        console.log('Examples:');
        console.log('  tsx run-migrations.ts public');
        console.log('  tsx run-migrations.ts tenant ff475b41-b21b-410d-9fea-aa02caa6a11c');
        console.log('  tsx run-migrations.ts setup');
        break;
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationManager.close();
  }
}

main().catch(console.error);