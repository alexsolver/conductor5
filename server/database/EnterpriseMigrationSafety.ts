// ===========================
// ENTERPRISE MIGRATION SAFETY SYSTEM
// Resolver migration safety gaps com rollback completo
// ===========================

import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationBackup {
  schemaName: string;
  backupId: string;
  timestamp: Date;
  backupPath: string;
  tablesBackedUp: string[];
  sizeMB: number;
}

interface MigrationResult {
  success: boolean;
  backupId?: string;
  migratedTables: string[];
  errors: string[];
  rollbackPerformed: boolean;
  duration: number;
}

export class EnterpriseMigrationSafety {
  private static instance: EnterpriseMigrationSafety;
  private backupDirectory = path.join(process.cwd(), 'migration-backups');
  private maxBackupRetention = 30; // dias

  static getInstance(): EnterpriseMigrationSafety {
    if (!EnterpriseMigrationSafety.instance) {
      EnterpriseMigrationSafety.instance = new EnterpriseMigrationSafety();
    }
    return EnterpriseMigrationSafety.instance;
  }

  constructor() {
    this.ensureBackupDirectory();
  }

  // ===========================
  // MIGRATION SAFETY PRINCIPAL
  // ===========================
  async safeMigrateLegacyTables(schemaName: string): Promise<MigrationResult> {
    const startTime = Date.now();
    let backupId: string | undefined;
    let rollbackPerformed = false;
    const migratedTables: string[] = [];
    const errors: string[] = [];

    try {
      console.log(`[EnterpriseMigrationSafety] Starting safe migration for schema: ${schemaName}`);

      // 1. BACKUP PRÉ-MIGRAÇÃO
      backupId = await this.createPreMigrationBackup(schemaName);
      console.log(`✅ Backup created: ${backupId}`);

      // 2. VALIDAR SCHEMA ANTES DA MIGRAÇÃO
      const preValidation = await this.validateSchemaIntegrity(schemaName);
      if (!preValidation.valid) {
        errors.push(`Schema validation failed: ${preValidation.errors.join(', ')}`);
        throw new Error('Pre-migration validation failed');
      }

      // 3. EXECUTAR MIGRAÇÃO EM TRANSAÇÃO ATÔMICA
      const migrationResult = await this.executeAtomicMigration(schemaName);
      migratedTables.push(...migrationResult.tables);

      // 4. VALIDAR SCHEMA APÓS MIGRAÇÃO
      const postValidation = await this.validateSchemaIntegrity(schemaName);
      if (!postValidation.valid) {
        errors.push(`Post-migration validation failed: ${postValidation.errors.join(', ')}`);
        throw new Error('Post-migration validation failed');
      }

      // 5. VERIFICAR INTEGRIDADE DOS DADOS
      const dataIntegrity = await this.verifyDataIntegrity(schemaName, migrationResult.tables);
      if (!dataIntegrity.valid) {
        errors.push(`Data integrity check failed: ${dataIntegrity.errors.join(', ')}`);
        throw new Error('Data integrity validation failed');
      }

      console.log(`✅ Migration completed successfully for ${schemaName}`);

      return {
        success: true,
        backupId,
        migratedTables,
        errors: [],
        rollbackPerformed: false,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error(`❌ Migration failed for ${schemaName}:`, error);
      errors.push(error instanceof Error ? error.message : String(error));

      // ROLLBACK AUTOMÁTICO
      if (backupId) {
        try {
          await this.performRollback(schemaName, backupId);
          rollbackPerformed = true;
          console.log(`✅ Rollback completed for ${schemaName}`);
        } catch (rollbackError) {
          console.error(`❌ Rollback failed for ${schemaName}:`, rollbackError);
          errors.push(`Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
      }

      return {
        success: false,
        backupId,
        migratedTables,
        errors,
        rollbackPerformed,
        duration: Date.now() - startTime
      };
    }
  }

  // ===========================
  // BACKUP PRÉ-MIGRAÇÃO
  // ===========================
  private async createPreMigrationBackup(schemaName: string): Promise<string> {
    const backupId = `${schemaName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupPath = path.join(this.backupDirectory, `${backupId}.sql`);

    try {
      // Obter lista de tabelas no schema
      const tablesResult = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ${schemaName}
        AND table_type = 'BASE TABLE'
      `);

      const tables = tablesResult.rows.map(row => row.table_name as string);
      
      if (tables.length === 0) {
        throw new Error(`No tables found in schema ${schemaName}`);
      }

      // Criar backup SQL
      let backupContent = `-- Migration Backup for ${schemaName}\n`;
      backupContent += `-- Created: ${new Date().toISOString()}\n`;
      backupContent += `-- Backup ID: ${backupId}\n\n`;

      for (const table of tables) {
        // Backup da estrutura da tabela
        const createTableResult = await db.execute(sql`
          SELECT pg_get_createtable_sql(${schemaName}, ${table}) as ddl
        `.catch(async () => {
          // Fallback para pg_dump style
          return await db.execute(sql`
            SELECT 
              'CREATE TABLE ' || quote_ident(table_schema) || '.' || quote_ident(table_name) || ' (' ||
              array_to_string(
                array_agg(
                  quote_ident(column_name) || ' ' || 
                  data_type ||
                  case when character_maximum_length is not null 
                    then '(' || character_maximum_length || ')'
                    else ''
                  end ||
                  case when is_nullable = 'NO' then ' NOT NULL' else '' end
                ),
                ', '
              ) || ');' as ddl
            FROM information_schema.columns 
            WHERE table_schema = ${schemaName} AND table_name = ${table}
            GROUP BY table_schema, table_name
          `);
        }));

        if (createTableResult.rows.length > 0) {
          backupContent += `-- Table: ${table}\n`;
          backupContent += `${createTableResult.rows[0].ddl}\n\n`;
        }

        // Backup dos dados
        const dataResult = await db.execute(sql`
          SELECT * FROM ${sql.identifier(schemaName)}.${sql.identifier(table)}
        `);

        if (dataResult.rows.length > 0) {
          backupContent += `-- Data for table: ${table}\n`;
          
          // Criar INSERT statements
          for (const row of dataResult.rows) {
            const columns = Object.keys(row);
            const values = Object.values(row).map(val => 
              val === null ? 'NULL' : 
              typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` :
              val
            );
            
            backupContent += `INSERT INTO ${schemaName}.${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          backupContent += '\n';
        }
      }

      // Salvar backup
      fs.writeFileSync(backupPath, backupContent);

      // Registrar backup
      const backup: MigrationBackup = {
        schemaName,
        backupId,
        timestamp: new Date(),
        backupPath,
        tablesBackedUp: tables,
        sizeMB: fs.statSync(backupPath).size / (1024 * 1024)
      };

      console.log(`✅ Backup created: ${backupId} (${backup.sizeMB.toFixed(2)} MB)`);
      return backupId;

    } catch (error) {
      console.error(`❌ Failed to create backup for ${schemaName}:`, error);
      throw error;
    }
  }

  // ===========================
  // MIGRAÇÃO ATÔMICA
  // ===========================
  private async executeAtomicMigration(schemaName: string): Promise<{ tables: string[] }> {
    const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');
    const migratedTables: string[] = [];

    // TRANSAÇÃO ATÔMICA - TUDO OU NADA
    await db.transaction(async (tx) => {
      console.log(`[AtomicMigration] Starting atomic migration for ${schemaName}`);

      // Skills table migration
      await tx.execute(sql`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ${schemaName} AND table_name = 'skills')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ${schemaName} AND table_name = 'skills' AND column_name = 'tenant_id') THEN
            ALTER TABLE ${sql.identifier(schemaName)}.skills ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId};
            ALTER TABLE ${sql.identifier(schemaName)}.skills ADD CONSTRAINT skills_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
          END IF;
        END $$;
      `);
      migratedTables.push('skills');

      // Certifications table migration
      await tx.execute(sql`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ${schemaName} AND table_name = 'certifications')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ${schemaName} AND table_name = 'certifications' AND column_name = 'tenant_id') THEN
            ALTER TABLE ${sql.identifier(schemaName)}.certifications ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId};
            ALTER TABLE ${sql.identifier(schemaName)}.certifications ADD CONSTRAINT certifications_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
          END IF;
        END $$;
      `);
      migratedTables.push('certifications');

      // User_skills table migration
      await tx.execute(sql`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ${schemaName} AND table_name = 'user_skills')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ${schemaName} AND table_name = 'user_skills' AND column_name = 'tenant_id') THEN
            ALTER TABLE ${sql.identifier(schemaName)}.user_skills ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId};
            ALTER TABLE ${sql.identifier(schemaName)}.user_skills ADD CONSTRAINT user_skills_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
          END IF;
        END $$;
      `);
      migratedTables.push('user_skills');

      // Customers table migration
      await tx.execute(sql`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ${schemaName} AND table_name = 'customers')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ${schemaName} AND table_name = 'customers' AND column_name = 'tenant_id') THEN
            ALTER TABLE ${sql.identifier(schemaName)}.customers ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId};
            ALTER TABLE ${sql.identifier(schemaName)}.customers ADD CONSTRAINT customers_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
          END IF;
        END $$;
      `);
      migratedTables.push('customers');

      // Tickets table migration
      await tx.execute(sql`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ${schemaName} AND table_name = 'tickets')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ${schemaName} AND table_name = 'tickets' AND column_name = 'tenant_id') THEN
            ALTER TABLE ${sql.identifier(schemaName)}.tickets ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT ${tenantId};
            ALTER TABLE ${sql.identifier(schemaName)}.tickets ADD CONSTRAINT tickets_tenant_id_format CHECK (LENGTH(tenant_id) = 36);
          END IF;
        END $$;
      `);
      migratedTables.push('tickets');

      console.log(`✅ Atomic migration completed for ${migratedTables.length} tables`);
    });

    return { tables: migratedTables };
  }

  // ===========================
  // VALIDAÇÃO DE INTEGRIDADE
  // ===========================
  private async validateSchemaIntegrity(schemaName: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Verificar se schema existe
      const schemaExists = await db.execute(sql`
        SELECT 1 FROM information_schema.schemata WHERE schema_name = ${schemaName}
      `);

      if (schemaExists.rows.length === 0) {
        errors.push(`Schema ${schemaName} does not exist`);
        return { valid: false, errors };
      }

      // Verificar integridade das tabelas principais
      const requiredTables = ['customers', 'tickets', 'ticket_messages'];
      
      for (const table of requiredTables) {
        const tableExists = await db.execute(sql`
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = ${schemaName} AND table_name = ${table}
        `);

        if (tableExists.rows.length === 0) {
          errors.push(`Required table ${table} not found in ${schemaName}`);
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Schema validation error: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors };
    }
  }

  private async verifyDataIntegrity(schemaName: string, tables: string[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      for (const table of tables) {
        // Verificar se tenant_id foi adicionado corretamente
        const tenantIdCheck = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM information_schema.columns 
          WHERE table_schema = ${schemaName} 
          AND table_name = ${table}
          AND column_name = 'tenant_id'
        `);

        if (parseInt(tenantIdCheck.rows[0].count as string) === 0) {
          errors.push(`tenant_id column not found in ${table}`);
        }

        // Verificar se dados existem e têm tenant_id válido
        const dataCheck = await db.execute(sql`
          SELECT COUNT(*) as total_rows,
                 COUNT(CASE WHEN tenant_id IS NULL OR LENGTH(tenant_id) != 36 THEN 1 END) as invalid_tenant_ids
          FROM ${sql.identifier(schemaName)}.${sql.identifier(table)}
        `);

        const totalRows = parseInt(dataCheck.rows[0].total_rows as string);
        const invalidIds = parseInt(dataCheck.rows[0].invalid_tenant_ids as string);

        if (invalidIds > 0) {
          errors.push(`${invalidIds} invalid tenant_id values found in ${table}`);
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Data integrity check error: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors };
    }
  }

  // ===========================
  // ROLLBACK SYSTEM
  // ===========================
  private async performRollback(schemaName: string, backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDirectory, `${backupId}.sql`);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    try {
      console.log(`[Rollback] Starting rollback for ${schemaName} using backup ${backupId}`);

      // 1. Drop schema completamente
      await db.execute(sql`DROP SCHEMA IF EXISTS ${sql.identifier(schemaName)} CASCADE`);

      // 2. Recriar schema
      await db.execute(sql`CREATE SCHEMA ${sql.identifier(schemaName)}`);

      // 3. Executar backup SQL
      const backupContent = fs.readFileSync(backupPath, 'utf-8');
      const statements = backupContent.split(';').filter(stmt => stmt.trim().length > 0);

      for (const statement of statements) {
        if (statement.trim() && !statement.trim().startsWith('--')) {
          await db.execute(sql.raw(statement.trim()));
        }
      }

      console.log(`✅ Rollback completed for ${schemaName}`);
    } catch (error) {
      console.error(`❌ Rollback failed for ${schemaName}:`, error);
      throw error;
    }
  }

  // ===========================
  // UTILITÁRIOS
  // ===========================
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDirectory)) {
      fs.mkdirSync(this.backupDirectory, { recursive: true });
    }
  }

  async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxBackupRetention);

    try {
      const files = fs.readdirSync(this.backupDirectory);
      
      for (const file of files) {
        const filePath = path.join(this.backupDirectory, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  getBackupStats(): { totalBackups: number; totalSizeMB: number; oldestBackup?: Date } {
    if (!fs.existsSync(this.backupDirectory)) {
      return { totalBackups: 0, totalSizeMB: 0 };
    }

    const files = fs.readdirSync(this.backupDirectory);
    let totalSize = 0;
    let oldestDate: Date | undefined;

    for (const file of files) {
      const filePath = path.join(this.backupDirectory, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      if (!oldestDate || stats.mtime < oldestDate) {
        oldestDate = stats.mtime;
      }
    }

    return {
      totalBackups: files.length,
      totalSizeMB: totalSize / (1024 * 1024),
      oldestBackup: oldestDate
    };
  }
}

// ===========================
// EXPORTAÇÃO SINGLETON
// ===========================
export const enterpriseMigrationSafety = EnterpriseMigrationSafety.getInstance();