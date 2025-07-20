
import { sql } from 'drizzle-orm';
import { schemaManager, db } from '../../../../db';

interface MonitoringState {
  tenantId: string;
  isActive: boolean;
  startedAt: string;
  startedBy: string;
  integrations: string[];
}

export class EmailMonitoringPersistence {
  private static readonly MONITORING_KEY = 'email_monitoring_state';

  static async saveMonitoringState(tenantId: string, state: MonitoringState): Promise<void> {
    try {
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);

      // Create or update monitoring state in system settings table
      await tenantDb.execute(sql`
        INSERT INTO system_settings (tenant_id, setting_key, setting_value, created_at, updated_at)
        VALUES (${tenantId}, ${this.MONITORING_KEY}, ${JSON.stringify(state)}, NOW(), NOW())
        ON CONFLICT (tenant_id, setting_key) 
        DO UPDATE SET 
          setting_value = ${JSON.stringify(state)},
          updated_at = NOW()
      `);
    } catch (error) {
      console.error('Error saving monitoring state:', error);
    }
  }

  static async getMonitoringState(tenantId: string): Promise<MonitoringState | null> {
    try {
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);

      const result = await tenantDb.execute(sql`
        SELECT setting_value FROM system_settings 
        WHERE tenant_id = ${tenantId} AND setting_key = ${this.MONITORING_KEY}
      `);

      if (result.rows.length > 0) {
        return JSON.parse(result.rows[0].setting_value);
      }
      return null;
    } catch (error) {
      console.error('Error getting monitoring state:', error);
      return null;
    }
  }

  static async clearMonitoringState(tenantId: string): Promise<void> {
    try {
      const { db: tenantDb } = await schemaManager.getTenantDb(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      await tenantDb.execute(sql`SET search_path TO ${sql.identifier(schemaName)}, public`);

      await tenantDb.execute(sql`
        DELETE FROM system_settings 
        WHERE tenant_id = ${tenantId} AND setting_key = ${this.MONITORING_KEY}
      `);
    } catch (error) {
      console.error('Error clearing monitoring state:', error);
    }
  }

  static async getAllActiveMonitoringStates(): Promise<MonitoringState[]> {
    try {
      // This would need to query across all tenant schemas
      // For now, we'll implement a simpler approach
      const states: MonitoringState[] = [];
      
      // Get all tenants from main database
      const tenantsResult = await db.execute(sql`
        SELECT id FROM tenants WHERE status = 'active'
      `);

      for (const tenant of tenantsResult.rows) {
        const state = await this.getMonitoringState(tenant.id);
        if (state && state.isActive) {
          states.push(state);
        }
      }

      return states;
    } catch (error) {
      console.error('Error getting all monitoring states:', error);
      return [];
    }
  }
}
