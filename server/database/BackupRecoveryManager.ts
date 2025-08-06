import { sql } from 'drizzle-orm';
import { db } from '../db';
import { logInfo, logError, logWarn } from '../utils/logger';
import { TenantValidator } from './TenantValidator';

// ===========================
// ENTERPRISE BACKUP & RECOVERY SYSTEM
// Fixes: No tenant-specific backup strategy
// ===========================

export class BackupRecoveryManager {
  
  // ===========================
  // TENANT-SPECIFIC BACKUP
  // ===========================
  static async createTenantBackup(tenantId: string): Promise<string> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${schemaName}_${timestamp}`;

      // Create backup schema
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(backupName)}`);

      // Backup all tenant tables
      const tables = ['customers', 'tickets', 'ticket_messages', 'activity_logs', 
                     'locations', 'customer_companies', 'company_memberships'];

      for (const table of tables) {
        await db.execute(sql`
          CREATE TABLE ${sql.identifier(backupName, table)} AS 
          SELECT * FROM ${sql.identifier(schemaName, table)}
        `);
      }

      // Create backup metadata
      await db.execute(sql`
        CREATE TABLE ${sql.identifier(backupName, '_backup_metadata')} AS 
        SELECT 
          '${tenantId}' as tenant_id,
          '${schemaName}' as source_schema,
          NOW() as backup_created_at,
          'FULL' as backup_type,
          '${process.env.NODE_ENV || 'development'}' as environment
      `);

      logInfo(`Tenant backup created successfully: ${backupName}`, { tenantId });
      return backupName;
    } catch (error) {
      logError('Error creating tenant backup', error, { tenantId });
      throw error;
    }
  }

  // ===========================
  // INCREMENTAL BACKUP
  // ===========================
  static async createIncrementalBackup(tenantId: string, lastBackupTime: Date): Promise<string> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `incremental_${schemaName}_${timestamp}`;

      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(backupName)}`);

      // Backup only changed data since last backup
      const tables = ['customers', 'tickets', 'ticket_messages', 'activity_logs'];

      for (const table of tables) {
        await db.execute(sql`
          CREATE TABLE ${sql.identifier(backupName, table)} AS 
          SELECT * FROM ${sql.identifier(schemaName, table)}
          WHERE updated_at > ${lastBackupTime.toISOString()}
        `);
      }

      await db.execute(sql`
        CREATE TABLE ${sql.identifier(backupName, '_backup_metadata')} AS 
        SELECT 
          '${tenantId}' as tenant_id,
          '${schemaName}' as source_schema,
          NOW() as backup_created_at,
          'INCREMENTAL' as backup_type,
          '${lastBackupTime.toISOString()}' as since_timestamp
      `);

      logInfo(`Incremental backup created: ${backupName}`, { tenantId });
      return backupName;
    } catch (error) {
      logError('Error creating incremental backup', error, { tenantId });
      throw error;
    }
  }

  // ===========================
  // POINT-IN-TIME RECOVERY
  // ===========================
  static async restoreToPointInTime(tenantId: string, targetTime: Date): Promise<void> {
    try {
      const validatedTenantId = TenantValidator.validateTenantId(tenantId);
      const schemaName = `tenant_${validatedTenantId.replace(/-/g, '_')}`;
      const recoverySchemaName = `recovery_${schemaName}_${Date.now()}`;

      // Find the best backup before target time
      const backupResult = await db.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE ${'backup_' + schemaName + '%'}
        AND schema_name IN (
          SELECT s.schema_name 
          FROM information_schema.schemata s
          JOIN lateral (
            SELECT backup_created_at 
            FROM ${sql.identifier(s.schema_name, '_backup_metadata')} 
            WHERE backup_created_at <= ${targetTime.toISOString()}
            LIMIT 1
          ) b ON true
        )
        ORDER BY schema_name DESC
        LIMIT 1
      `);

      if (!backupResult.rows.length) {
        throw new Error(`No backup found before target time: ${targetTime}`);
      }

      const sourceBackup = backupResult.rows[0].schema_name;
      
      // Create recovery schema
      await db.execute(sql`CREATE SCHEMA ${sql.identifier(recoverySchemaName)}`);

      // Restore tables from backup
      const tables = ['customers', 'tickets', 'ticket_messages', 'activity_logs'];
      for (const table of tables) {
        await db.execute(sql`
          CREATE TABLE ${sql.identifier(recoverySchemaName, table)} AS 
          SELECT * FROM ${sql.identifier(sourceBackup, table)}
        `);
      }

      logInfo(`Point-in-time recovery completed: ${recoverySchemaName}`, { 
        tenantId, 
        targetTime: targetTime.toISOString(),
        sourceBackup 
      });
    } catch (error) {
      logError('Error in point-in-time recovery', error, { tenantId, targetTime });
      throw error;
    }
  }

  // ===========================
  // BACKUP CLEANUP & RETENTION
  // ===========================
  static async cleanupOldBackups(retentionDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Find old backup schemas
      const oldBackups = await db.execute(sql`
        SELECT s.schema_name 
        FROM information_schema.schemata s
        WHERE s.schema_name LIKE 'backup_%' 
        AND EXISTS (
          SELECT 1 FROM ${sql.identifier(s.schema_name, '_backup_metadata')} 
          WHERE backup_created_at < ${cutoffDate.toISOString()}
        )
      `);

      // Drop old backup schemas
      for (const backup of oldBackups.rows) {
        await db.execute(sql`DROP SCHEMA ${sql.identifier(backup.schema_name)} CASCADE`);
        logInfo(`Cleaned up old backup: ${backup.schema_name}`);
      }

      logInfo(`Backup cleanup completed, removed ${oldBackups.rows.length} old backups`);
    } catch (error) {
      logError('Error cleaning up old backups', error, { retentionDays });
      throw error;
    }
  }

  // ===========================
  // BACKUP VERIFICATION
  // ===========================
  static async verifyBackupIntegrity(backupSchemaName: string): Promise<boolean> {
    try {
      // Check if backup schema exists
      const schemaExists = await db.execute(sql`
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = ${backupSchemaName}
      `);

      if (!schemaExists.rows.length) {
        logWarn(`Backup schema not found: ${backupSchemaName}`);
        return false;
      }

      // Check if metadata table exists
      const metadataExists = await db.execute(sql`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = ${backupSchemaName} 
        AND table_name = '_backup_metadata'
      `);

      if (!metadataExists.rows.length) {
        logWarn(`Backup metadata missing: ${backupSchemaName}`);
        return false;
      }

      // Verify table counts
      const expectedTables = ['customers', 'tickets', 'ticket_messages', 'activity_logs'];
      for (const table of expectedTables) {
        const tableExists = await db.execute(sql`
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = ${backupSchemaName} 
          AND table_name = ${table}
        `);

        if (!tableExists.rows.length) {
          logWarn(`Backup table missing: ${table} in ${backupSchemaName}`);
          return false;
        }
      }

      logInfo(`Backup integrity verified: ${backupSchemaName}`);
      return true;
    } catch (error) {
      logError('Error verifying backup integrity', error, { backupSchemaName });
      return false;
    }
  }

  // ===========================
  // DISASTER RECOVERY STATUS
  // ===========================
  static async getDisasterRecoveryStatus(): Promise<any> {
    try {
      // Get all backup information
      const backups = await db.execute(sql`
        SELECT 
          s.schema_name,
          m.tenant_id,
          m.backup_type,
          m.backup_created_at,
          m.source_schema
        FROM information_schema.schemata s
        JOIN lateral (
          SELECT * FROM ${sql.identifier(s.schema_name, '_backup_metadata')} LIMIT 1
        ) m ON true
        WHERE s.schema_name LIKE 'backup_%'
        ORDER BY m.backup_created_at DESC
      `);

      // Calculate recovery metrics
      const tenantCoverage = await db.execute(sql`
        SELECT COUNT(DISTINCT id) as total_tenants
        FROM tenants WHERE is_active = true
      `);

      const backedUpTenants = await db.execute(sql`
        SELECT COUNT(DISTINCT m.tenant_id) as backed_up_tenants
        FROM information_schema.schemata s
        JOIN lateral (
          SELECT tenant_id FROM ${sql.identifier(s.schema_name, '_backup_metadata')} LIMIT 1
        ) m ON true
        WHERE s.schema_name LIKE 'backup_%'
        AND m.backup_created_at > NOW() - INTERVAL '7 days'
      `);

      const totalTenants = Number(tenantCoverage.rows[0]?.total_tenants || 0);
      const backedUp = Number(backedUpTenants.rows[0]?.backed_up_tenants || 0);

      return {
        totalBackups: backups.rows.length,
        recentBackups: backups.rows,
        tenantCoverage: {
          total: totalTenants,
          backedUp: backedUp,
          coveragePercent: totalTenants > 0 ? (backedUp / totalTenants) * 100 : 0
        },
        oldestBackup: backups.rows[backups.rows.length - 1]?.backup_created_at,
        newestBackup: backups.rows[0]?.backup_created_at
      };
    } catch (error) {
      logError('Error getting disaster recovery status', error);
      return {
        totalBackups: 0,
        recentBackups: [],
        tenantCoverage: { total: 0, backedUp: 0, coveragePercent: 0 }
      };
    }
  }
}