
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import fs from 'fs/promises';

export class MigrationManager {
  private pool: Pool;
  private db: any;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for migrations');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    this.db = drizzle(this.pool);
  }

  async runPublicMigrations() {
    console.log('🔄 Running public schema migrations...');
    
    try {
      const publicMigrationsPath = path.join(__dirname, '../public');
      const migrationFiles = await fs.readdir(publicMigrationsPath);
      
      // Sort migration files
      const sqlFiles = migrationFiles
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of sqlFiles) {
        console.log(`📄 Executing migration: ${file}`);
        const filePath = path.join(publicMigrationsPath, file);
        const sql = await fs.readFile(filePath, 'utf-8');
        
        await this.pool.query(sql);
        console.log(`✅ Migration ${file} executed successfully`);
      }

      console.log('✅ All public migrations completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Public migration error:', error);
      throw error;
    }
  }

  async runTenantMigrations(tenantId: string) {
    console.log(`🔄 Running tenant migrations for: ${tenantId}`);
    
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Create tenant schema if it doesn't exist
      await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      
      const tenantMigrationsPath = path.join(__dirname, '../tenant');
      const migrationFiles = await fs.readdir(tenantMigrationsPath);
      
      // Sort migration files
      const sqlFiles = migrationFiles
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of sqlFiles) {
        console.log(`📄 Executing tenant migration: ${file} for schema: ${schemaName}`);
        const filePath = path.join(tenantMigrationsPath, file);
        let sql = await fs.readFile(filePath, 'utf-8');
        
        // Replace placeholder schema name
        sql = sql.replace(/\{TENANT_SCHEMA\}/g, schemaName);
        
        await this.pool.query(sql);
        console.log(`✅ Tenant migration ${file} executed successfully for ${schemaName}`);
      }

      console.log(`✅ All tenant migrations completed successfully for: ${tenantId}`);
      return true;
    } catch (error) {
      console.error(`❌ Tenant migration error for ${tenantId}:`, error);
      throw error;
    }
  }

  async createMigrationTable() {
    const createMigrationTableSQL = `
      CREATE TABLE IF NOT EXISTS public.pg_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.pool.query(createMigrationTableSQL);
  }

  async close() {
    await this.pool.end();
  }
}

// CLI runner
if (require.main === module) {
  const migrationManager = new MigrationManager();
  
  const command = process.argv[2];
  const tenantId = process.argv[3];

  (async () => {
    try {
      await migrationManager.createMigrationTable();

      switch (command) {
        case 'public':
          await migrationManager.runPublicMigrations();
          break;
        case 'tenant':
          if (!tenantId) {
            console.error('❌ Tenant ID required for tenant migrations');
            process.exit(1);
          }
          await migrationManager.runTenantMigrations(tenantId);
          break;
        case 'all':
          await migrationManager.runPublicMigrations();
          console.log('ℹ️  Public migrations completed. Run tenant migrations separately.');
          break;
        default:
          console.log('Usage: tsx migration-manager.ts [public|tenant|all] [tenant-id]');
          console.log('Examples:');
          console.log('  tsx migration-manager.ts public');
          console.log('  tsx migration-manager.ts tenant ff475b41-b21b-410d-9fea-aa02caa6a11c');
          console.log('  tsx migration-manager.ts all');
      }

      await migrationManager.close();
      console.log('🎉 Migration process completed!');
    } catch (error) {
      console.error('💥 Migration failed:', error);
      await migrationManager.close();
      process.exit(1);
    }
  })();
}
