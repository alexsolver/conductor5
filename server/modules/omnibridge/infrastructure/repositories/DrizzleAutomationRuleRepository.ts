import { db, sql } from '../../../../db';
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRuleEntity } from '../../domain/entities/AutomationRule';

export class DrizzleAutomationRuleRepository implements IAutomationRuleRepository {

  async create(rule: AutomationRuleEntity): Promise<AutomationRuleEntity> {
    try {
      console.log(`🔍 [DrizzleAutomationRuleRepository] Creating rule: ${rule.name}`);

      const result = await db.execute(sql`
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

  async findById(id: string, tenantId: string): Promise<AutomationRuleEntity | null> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rule: ${id} for tenant: ${tenantId}`);

    try {
      const result = await db.execute(sql`
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

  async findByTenant(tenantId: string, filters?: any): Promise<AutomationRuleEntity[]> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rules for tenant: ${tenantId}`);

    try {
      const result = await db.execute(sql`
        SELECT * FROM omnibridge_rules WHERE tenant_id = ${tenantId} 
        ORDER BY priority ASC, created_at DESC
      `);

      return result.rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding rules: ${(error as Error).message}`);
      throw error;
    }
  }

  async getStats(tenantId: string): Promise<{
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    totalExecutions: number;
  }> {
    try {
      const result = await db.execute(sql`
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

  async update(rule: AutomationRuleEntity): Promise<AutomationRuleEntity> {
    try {
      console.log(`🔧 [DrizzleAutomationRuleRepository] Updating rule: ${rule.id}`);

      const result = await db.execute(sql`
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

      await db.execute(sql`
        DELETE FROM omnibridge_rules WHERE id = ${id} AND tenant_id = ${tenantId}
      `);

      return true;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error deleting rule: ${(error as Error).message}`);
      throw error;
    }
  }

  private mapRowToEntity(row: any): AutomationRuleEntity {
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

    return new AutomationRuleEntity(
      row.id,
      row.name,
      parseJsonField(row.trigger_conditions, []),
      parseJsonField(row.action_parameters, []),
      row.tenant_id,
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