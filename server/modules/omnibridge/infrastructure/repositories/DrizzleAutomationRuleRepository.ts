import { db } from '../../../../db';
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRule } from '../../domain/entities/AutomationRule';
import { eq, and } from 'drizzle-orm';

export class DrizzleAutomationRuleRepository implements IAutomationRuleRepository {

  async create(rule: AutomationRule): Promise<AutomationRule> {
    try {
      console.log(`🔍 [DrizzleAutomationRuleRepository] Creating rule: ${rule.name}`);

      const triggerType = rule.triggers[0]?.type || 'new_message';
      const actionType = rule.actions[0]?.type || 'auto_reply';

      const result = await db.execute(`
        INSERT INTO omnibridge_rules (
          id, tenant_id, name, description, is_enabled,
          trigger_type, trigger_conditions, triggers, action_type, action_parameters, actions,
          priority, execution_stats, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
        ) RETURNING *
      `, [
        rule.id,
        rule.tenantId,
        rule.name,
        rule.description,
        rule.isEnabled,
        triggerType,
        JSON.stringify(rule.triggers[0]?.conditions || {}),
        JSON.stringify(rule.triggers),
        actionType,
        JSON.stringify(rule.actions[0]?.parameters || {}),
        JSON.stringify(rule.actions),
        rule.priority,
        JSON.stringify(rule.executionStats),
        JSON.stringify(rule.metadata)
      ]);

      // Handle the result correctly
      if (result.rows && result.rows.length > 0) {
        return this.mapRowToRule(result.rows[0]);
      } else {
        // If no rows returned, create a basic rule object
        return {
          id: rule.id,
          tenantId: rule.tenantId,
          name: rule.name,
          description: rule.description,
          isEnabled: rule.isEnabled,
          priority: rule.priority,
          triggers: rule.triggers,
          actions: rule.actions,
          executionStats: rule.executionStats,
          metadata: rule.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error creating rule: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string, tenantId: string): Promise<AutomationRule | null> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rule: ${id} for tenant: ${tenantId}`);

    try {
      const result = await db.execute(`
        SELECT * FROM omnibridge_rules 
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return this.mapRowToRule(row);
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding rule: ${error.message}`);
      throw error;
    }
  }

  async findByTenant(tenantId: string, filters?: any): Promise<AutomationRule[]> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rules for tenant: ${tenantId}`);

    try {
      let query = `SELECT * FROM omnibridge_rules WHERE tenant_id = $1`;
      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (filters?.isEnabled !== undefined) {
        query += ` AND is_enabled = $${paramIndex}`;
        params.push(filters.isEnabled);
        paramIndex++;
      }

      if (filters?.priority) {
        query += ` AND priority = $${paramIndex}`;
        params.push(filters.priority);
        paramIndex++;
      }

      if (filters?.search) {
        query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`;
        params.push(`%${filters.search}%`, `%${filters.search}%`);
        paramIndex += 2;
      }

      query += ` ORDER BY priority ASC, created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await db.execute(query, params);
      return result.rows.map(row => this.mapRowToRule(row));
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding rules: ${error.message}`);
      throw error;
    }
  }

  async findActiveRules(tenantId: string): Promise<AutomationRule[]> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding active rules for tenant: ${tenantId}`);

    try {
      const result = await db.execute(`
        SELECT * FROM omnibridge_rules 
        WHERE tenant_id = $1 AND is_enabled = true
        ORDER BY priority ASC
      `, [tenantId]);

      return result.rows.map(row => this.mapRowToRule(row));
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding active rules: ${error.message}`);
      throw error;
    }
  }

  async update(rule: AutomationRule): Promise<AutomationRule> {
    console.log(`💾 [DrizzleAutomationRuleRepository] Updating automation rule: ${rule.id}`);

    try {
      await db.execute(`
        UPDATE omnibridge_rules SET
          name = $1, description = $2, is_enabled = $3, priority = $4,
          triggers = $5, actions = $6, execution_stats = $7, metadata = $8, updated_at = $9
        WHERE id = $10 AND tenant_id = $11
      `, [
        rule.name,
        rule.description,
        rule.isEnabled,
        rule.priority,
        JSON.stringify(rule.triggers),
        JSON.stringify(rule.actions),
        JSON.stringify(rule.executionStats),
        JSON.stringify(rule.metadata),
        rule.updatedAt,
        rule.id,
        rule.tenantId
      ]);

      console.log(`✅ [DrizzleAutomationRuleRepository] Updated automation rule: ${rule.id}`);
      return rule;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error updating rule: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    console.log(`🗑️ [DrizzleAutomationRuleRepository] Deleting automation rule: ${id}`);

    try {
      const result = await db.execute(`
        DELETE FROM omnibridge_rules 
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]);

      const success = result.rowCount > 0;
      console.log(`✅ [DrizzleAutomationRuleRepository] Deleted automation rule: ${id}, success: ${success}`);
      return success;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error deleting rule: ${error.message}`);
      throw error;
    }
  }

  async getStats(tenantId: string): Promise<any> {
    console.log(`📊 [DrizzleAutomationRuleRepository] Getting stats for tenant: ${tenantId}`);

    try {
      // First check if table exists and has the expected structure
      const tableCheck = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'omnibridge_rules' 
        AND column_name IN ('execution_stats', 'is_enabled')
      `);

      if (tableCheck.rows.length === 0) {
        // Table doesn't exist or columns missing, return default stats
        return {
          totalRules: 0,
          enabledRules: 0,
          disabledRules: 0,
          totalExecutions: 0
        };
      }

      const result = await db.execute(`
        SELECT 
          COUNT(*) as total_rules,
          COUNT(*) FILTER (WHERE is_enabled = true) as enabled_rules,
          COUNT(*) FILTER (WHERE is_enabled = false) as disabled_rules,
          COALESCE(SUM(CASE 
            WHEN execution_stats ? 'totalExecutions' 
            THEN (execution_stats->>'totalExecutions')::int 
            ELSE 0 
          END), 0) as total_executions
        FROM omnibridge_rules 
        WHERE tenant_id = $1
      `, [tenantId]);

      const row = result.rows[0];
      return {
        totalRules: parseInt(row.total_rules || '0'),
        enabledRules: parseInt(row.enabled_rules || '0'),
        disabledRules: parseInt(row.disabled_rules || '0'),
        totalExecutions: parseInt(row.total_executions || '0')
      };
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error getting stats: ${error.message}`);
      // Return default stats if there's any error
      return {
        totalRules: 0,
        enabledRules: 0,
        disabledRules: 0,
        totalExecutions: 0
      };
    }
  }

  async updateStats(ruleId: string, tenantId: string, stats: any): Promise<void> {
    console.log(`📊 [DrizzleAutomationRuleRepository] Updating stats for rule: ${ruleId}`);

    try {
      await db.execute(`
        UPDATE omnibridge_rules SET
          execution_stats = $1, updated_at = $2
        WHERE id = $3 AND tenant_id = $4
      `, [
        JSON.stringify(stats),
        new Date(),
        ruleId,
        tenantId
      ]);

      console.log(`✅ [DrizzleAutomationRuleRepository] Updated stats for rule: ${ruleId}`);
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error updating stats: ${error.message}`);
      throw error;
    }
  }

  private mapRowToRule(row: any): AutomationRule {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      isEnabled: row.is_enabled,
      priority: row.priority,
      triggers: JSON.parse(row.triggers || '[{"type": "new_message", "conditions": {}}]'),
      actions: JSON.parse(row.actions || '[{"type": "auto_reply", "parameters": {}}]'),
      executionStats: JSON.parse(row.execution_stats || '{"totalExecutions": 0, "successfulExecutions": 0, "failedExecutions": 0}'),
      metadata: JSON.parse(row.metadata || '{"version": 1}'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}