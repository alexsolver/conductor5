import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

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
    console.log('🔄 [MIGRATION-MANAGER] Running public migrations...');

    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const publicMigrationsPath = path.join(__dirname, '..', 'public');
      const migrationFiles = fs.readdirSync(publicMigrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const migrationName = file.replace('.sql', '');

        // Check if migration already executed
        const existing = await this.pool.query(
          'SELECT id FROM pg_migrations WHERE name = $1',
          [migrationName]
        );

        if (existing.rows.length === 0) {
          console.log(`📝 [MIGRATION-MANAGER] Running migration: ${migrationName}`);

          const migrationSQL = fs.readFileSync(
            path.join(publicMigrationsPath, file),
            'utf-8'
          );

          await this.pool.query(migrationSQL);

          await this.pool.query(
            'INSERT INTO pg_migrations (name, executed_at) VALUES ($1, $2)',
            [migrationName, new Date()]
          );

          console.log(`✅ [MIGRATION-MANAGER] Completed migration: ${migrationName}`);
        } else {
          console.log(`⏭️ [MIGRATION-MANAGER] Skipping migration: ${migrationName} (already executed)`);
        }
      }

      console.log('✅ [MIGRATION-MANAGER] Public migrations completed');
    } catch (error) {
      console.error('❌ [MIGRATION-MANAGER] Public migration error:', error);
      throw error;
    }
  }

  async runTenantMigrations(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    try {
      console.log(`🔧 [MIGRATION-MANAGER] Running tenant migrations for schema: ${schemaName}`);

      // Create schema if not exists
      await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      // Set search path to tenant schema
      await this.pool.query(`SET search_path TO "${schemaName}", public`);

      // Get migration files
      const migrationFiles = await this.getTenantMigrationFiles();

      for (const file of migrationFiles) {
        await this.executeTenantMigration(file, schemaName);
      }

      console.log(`✅ [MIGRATION-MANAGER] All tenant migrations completed for: ${schemaName}`);
    } catch (error) {
      console.error(`❌ [MIGRATION-MANAGER] Tenant migration failed for ${schemaName}:`, error);
      throw error;
    }
  }

  private async getTenantMigrationFiles(): Promise<string[]> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const tenantMigrationsPath = path.join(__dirname, '..', 'tenant');
    const migrationFiles = fs.readdirSync(tenantMigrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    return migrationFiles;
  }

  private async executeTenantMigration(filename: string, schemaName: string): Promise<void> {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const migrationPath = path.join(__dirname, '..', 'tenant', filename);
      let migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Replace any schema placeholders
      migrationSQL = migrationSQL.replace(/\{schemaName\}/g, schemaName);

      console.log(`📝 [MIGRATION-MANAGER] Executing migration: ${filename} for schema: ${schemaName}`);

      // Execute the migration
      await this.pool.query(migrationSQL);

      // Record the migration
      await this.recordMigration(filename, schemaName);

      console.log(`✅ [MIGRATION-MANAGER] Migration ${filename} completed for ${schemaName}`);
    } catch (error) {
      console.error(`❌ [MIGRATION-MANAGER] Migration ${filename} failed for ${schemaName}:`, error);
      throw error;
    }
  }

  private async recordMigration(filename: string, schemaName: string): Promise<void> {
    const migrationName = `${schemaName}_${filename.replace('.sql', '')}`;

    // Check if migration already executed
    const existing = await this.pool.query(
      'SELECT id FROM public.pg_migrations WHERE name = $1',
      [migrationName]
    );

    if (existing.rows.length === 0) {
      await this.pool.query(
        'INSERT INTO public.pg_migrations (name, executed_at) VALUES ($1, $2)',
        [migrationName, new Date()]
      );
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
if (import.meta.url.startsWith('file://') && process.argv[1] === fileURLToPath(import.meta.url)) {
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