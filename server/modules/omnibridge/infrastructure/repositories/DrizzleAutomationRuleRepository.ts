import { db, sql, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRule } from '../../domain/entities/AutomationRule';
import { eq } from 'drizzle-orm';

export class DrizzleAutomationRuleRepository implements IAutomationRuleRepository {
  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  async create(rule: AutomationRule): Promise<AutomationRule> {
    try {
      console.log(`🔍 [DrizzleAutomationRuleRepository] Creating rule: ${rule.name}`);

      const tenantDb = await this.getTenantDb(rule.tenantId);
      const result = await tenantDb.execute(sql`
        INSERT INTO omnibridge_rules (
          id, tenant_id, name, description, is_enabled, trigger_type, action_type,
          trigger_conditions, action_parameters, triggers, actions, priority,
          execution_stats, metadata, created_at, updated_at, created_by
        ) VALUES (
          ${rule.id}, ${rule.tenantId}, ${rule.name}, ${rule.description || ''}, 
          ${rule.isActive}, 'message_received', 'create_ticket',
          ${JSON.stringify(rule.conditions)}, ${JSON.stringify(rule.actions)},
          ${JSON.stringify(rule.conditions)}, ${JSON.stringify(rule.actions)}, 
          ${rule.priority}, '{"totalExecutions": 0, "successfulExecutions": 0, "failedExecutions": 0}',
          '{"version": 1}', NOW(), NOW(), 'system'
        ) RETURNING *
      `);

      if (result.rows && result.rows.length > 0) {
        const createdRule = this.mapRowToEntity(result.rows[0]);

        // Registrar regra no engine de automação
        const { GlobalAutomationManager } = await import('../services/AutomationEngine');
        const automationManager = GlobalAutomationManager.getInstance();
        const engine = automationManager.getEngine(rule.tenantId);

        // Criar AutomationRule para o engine
        const { AutomationRule } = await import('../../domain/entities/AutomationRule');
        const engineRule = new AutomationRule(
          createdRule.id,
          createdRule.tenantId,
          createdRule.name,
          createdRule.description || '',
          createdRule.conditions,
          createdRule.actions,
          createdRule.isActive,
          createdRule.priority
        );

        engine.addRule(engineRule);
        console.log(`✅ [DrizzleAutomationRuleRepository] Rule added to automation engine: ${createdRule.name}`);

        return createdRule;
      }

      return rule;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error creating rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async findById(id: string, tenantId: string): Promise<AutomationRule | null> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rule: ${id} for tenant: ${tenantId}`);

    try {
      const tenantDb = await this.getTenantDb(tenantId); // Corrected from rule.tenantId to tenantId
      const result = await tenantDb.execute(sql`
        SELECT * FROM omnibridge_rules 
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return this.mapRowToEntity(row);
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async findByTenantId(tenantId: string): Promise<any[]> {
    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select().from(schema.omnibridgeAutomationRules)
      .where(eq(schema.omnibridgeAutomationRules.tenantId, tenantId));

    return results.map(rule => ({
      ...rule,
      triggers: rule.triggers ? (Array.isArray(rule.triggers) ? rule.triggers : JSON.parse(rule.triggers)) : [],
      actions: rule.actions ? (Array.isArray(rule.actions) ? rule.actions : JSON.parse(rule.actions)) : []
    }));
  }

  async findByTenant(tenantId: string, filters?: any): Promise<{ rules: any[]; total: number; stats: any }> {
    const rules = await this.findByTenantId(tenantId);
    return {
      rules,
      total: rules.length,
      stats: {
        enabled: rules.filter(r => r.isEnabled).length,
        disabled: rules.filter(r => !r.isEnabled).length
      }
    };
  }

  async getStats(tenantId: string): Promise<{
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    totalExecutions: number;
  }> {
    try {
      const tenantDb = await this.getTenantDb(tenantId); // Corrected from rule.tenantId to tenantId
      const result = await tenantDb.execute(sql`
        SELECT 
          COUNT(*) as total_rules,
          COUNT(CASE WHEN is_enabled = true THEN 1 END) as enabled_rules,
          COUNT(CASE WHEN is_enabled = false THEN 1 END) as disabled_rules,
          COALESCE(SUM((execution_stats->>'totalExecutions')::int), 0) as total_executions
        FROM omnibridge_rules 
        WHERE tenant_id = ${tenantId}
      `);

      const row = result.rows[0];
      return {
        totalRules: parseInt(row.total_rules || '0'),
        enabledRules: parseInt(row.enabled_rules || '0'),
        disabledRules: parseInt(row.disabled_rules || '0'),
        totalExecutions: parseInt(row.total_executions || '0')
      };
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error getting stats: ${(error as Error).message}`);
      return {
        totalRules: 0,
        enabledRules: 0,
        disabledRules: 0,
        totalExecutions: 0
      };
    }
  }

  async update(rule: AutomationRule): Promise<AutomationRule> {
    try {
      console.log(`🔧 [DrizzleAutomationRuleRepository] Updating rule: ${rule.id}`);

      const tenantDb = await this.getTenantDb(rule.tenantId);
      const result = await tenantDb.execute(sql`
        UPDATE omnibridge_rules SET
          name = ${rule.name}, description = ${rule.description || ''}, 
          is_enabled = ${rule.isActive}, priority = ${rule.priority},
          trigger_conditions = ${JSON.stringify(rule.conditions)}, 
          action_parameters = ${JSON.stringify(rule.actions)}, 
          triggers = ${JSON.stringify(rule.conditions)},
          actions = ${JSON.stringify(rule.actions)},
          updated_at = NOW(), updated_by = 'system'
        WHERE id = ${rule.id} AND tenant_id = ${rule.tenantId}
        RETURNING *
      `);

      if (result.rows && result.rows.length > 0) {
        return this.mapRowToEntity(result.rows[0]);
      }

      return rule;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error updating rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      console.log(`🗑️ [DrizzleAutomationRuleRepository] Deleting rule: ${id}`);

      const tenantDb = await this.getTenantDb(tenantId);
      await tenantDb.execute(sql`
        DELETE FROM omnibridge_rules WHERE id = ${id} AND tenant_id = ${tenantId}
      `);

      return true;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error deleting rule: ${(error as Error).message}`);
      throw error;
    }
  }

  private mapRowToEntity(row: any): AutomationRule {
    // Parse JSON fields safely
    const parseJsonField = (field: any, defaultValue: any = []) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.warn(`Failed to parse JSON field: ${field}`);
          return defaultValue;
        }
      }
      return field || defaultValue;
    };

    return new AutomationRule(
      row.id,
      row.tenant_id, // tenantId was mapped to row.tenant_id
      row.name,
      parseJsonField(row.trigger_conditions, []),
      parseJsonField(row.action_parameters, []),
      row.description,
      row.is_enabled,
      row.priority,
      0, // executionCount - não armazenado na tabela atual
      0, // successCount - não armazenado na tabela atual
      row.last_executed,
      row.created_at,
      row.updated_at
    );
  }
}