import { db } from '../../../../db';
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRuleEntity } from '../../domain/entities/AutomationRule';

export class DrizzleAutomationRuleRepository implements IAutomationRuleRepository {

  async create(rule: AutomationRuleEntity): Promise<AutomationRuleEntity> {
    try {
      console.log(`🔍 [DrizzleAutomationRuleRepository] Creating rule: ${rule.name}`);

      const result = await db.execute({
        sql: `
          INSERT INTO omnibridge_rules (
            id, tenant_id, name, description, is_enabled, priority,
            trigger_conditions, action_parameters, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
          ) RETURNING *
        `,
        args: [
          rule.id,
          rule.tenantId,
          rule.name,
          rule.description || '',
          rule.isActive,
          rule.priority,
          JSON.stringify(rule.conditions),
          JSON.stringify(rule.actions)
        ]
      });

      if (result.rows && result.rows.length > 0) {
        return this.mapRowToEntity(result.rows[0]);
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
      const result = await db.execute({
        sql: `
          SELECT * FROM omnibridge_rules 
          WHERE id = $1 AND tenant_id = $2
        `,
        args: [id, tenantId]
      });

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

  async findByTenant(tenantId: string): Promise<AutomationRuleEntity[]> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rules for tenant: ${tenantId}`);

    try {
      const result = await db.execute({
        sql: `SELECT * FROM omnibridge_rules WHERE tenant_id = $1 ORDER BY priority ASC, created_at DESC`,
        args: [tenantId]
      });

      return result.rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding rules: ${(error as Error).message}`);
      throw error;
    }
  }

  async update(rule: AutomationRuleEntity): Promise<AutomationRuleEntity> {
    try {
      console.log(`🔧 [DrizzleAutomationRuleRepository] Updating rule: ${rule.id}`);

      const result = await db.execute({
        sql: `
          UPDATE omnibridge_rules SET
            name = $1, description = $2, is_enabled = $3, priority = $4,
            trigger_conditions = $5, action_parameters = $6, updated_at = NOW()
          WHERE id = $7 AND tenant_id = $8
          RETURNING *
        `,
        args: [
          rule.name,
          rule.description || '',
          rule.isActive,
          rule.priority,
          JSON.stringify(rule.conditions),
          JSON.stringify(rule.actions),
          rule.id,
          rule.tenantId
        ]
      });

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

      await db.execute({
        sql: `DELETE FROM omnibridge_rules WHERE id = $1 AND tenant_id = $2`,
        args: [id, tenantId]
      });

      return true;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error deleting rule: ${(error as Error).message}`);
      throw error;
    }
  }

  private mapRowToEntity(row: any): AutomationRuleEntity {
    return new AutomationRuleEntity(
      row.id,
      row.name,
      JSON.parse(row.trigger_conditions || '[]'),
      JSON.parse(row.action_parameters || '[]'),
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