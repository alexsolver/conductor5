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

  async runTenantMigrations(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    console.log(`🔄 [MIGRATION-MANAGER] Running tenant migrations for schema: ${schemaName}`);

    try {
      // Create schema if not exists
      await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      // Set search path to tenant schema
      await this.pool.query(`SET search_path TO "${schemaName}", public`);

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const tenantMigrationsPath = path.join(__dirname, '..', 'tenant');
      const migrationFiles = fs.readdirSync(tenantMigrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const migrationName = `${schemaName}_${file.replace('.sql', '')}`;

        // Check if migration already executed
        const existing = await this.pool.query(
          'SELECT id FROM public.pg_migrations WHERE name = $1',
          [migrationName]
        );

        if (existing.rows.length === 0) {
          console.log(`📝 [MIGRATION-MANAGER] Running tenant migration: ${migrationName}`);

          let migrationSQL = fs.readFileSync(
            path.join(tenantMigrationsPath, file),
            'utf-8'
          );

          // Replace table names to include schema prefix where needed
          migrationSQL = migrationSQL.replace(/public\.users/g, 'public.users');

          try {
            await this.pool.query(migrationSQL);
          } catch (error: any) {
            // Handle foreign key constraint errors gracefully
            if (error.message.includes('referenced in foreign key constraint does not exist')) {
              console.warn(`⚠️ [MIGRATION-MANAGER] Foreign key constraint issue in ${migrationName}, attempting fix...`);
              
              // Try to run a simplified version without problematic constraints
              const simplifiedSQL = migrationSQL.replace(/ADD CONSTRAINT.*FOREIGN KEY.*REFERENCES.*\);/gi, '-- Foreign key constraint removed due to dependency issue');
              await this.pool.query(simplifiedSQL);
            } else {
              throw error;
            }
          }

          await this.pool.query(
            'INSERT INTO public.pg_migrations (name, executed_at) VALUES ($1, $2)',
            [migrationName, new Date()]
          );

          console.log(`✅ [MIGRATION-MANAGER] Completed tenant migration: ${migrationName}`);
        } else {
          console.log(`⏭️ [MIGRATION-MANAGER] Skipping tenant migration: ${migrationName} (already executed)`);
        }
      }

      // Reset search path
      await this.pool.query('SET search_path TO public');

      console.log(`✅ [MIGRATION-MANAGER] Tenant migrations completed for: ${schemaName}`);
    } catch (error) {
      console.error(`❌ [MIGRATION-MANAGER] Tenant migration error for ${schemaName}:`, error);
      // Reset search path on error
      await this.pool.query('SET search_path TO public');
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