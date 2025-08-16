import { db } from '../../../../db';
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRuleEntity } from '../../domain/entities/AutomationRule';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../../../../../shared/schema';

export class DrizzleAutomationRuleRepository implements IAutomationRuleRepository {

  async create(rule: AutomationRuleEntity): Promise<AutomationRuleEntity> {
    try {
      console.log(`🔍 [DrizzleAutomationRuleRepository] Creating rule: ${rule.name}`);

      const [created] = await db
        .insert(schema.omnibridgeRules)
        .values({
          id: rule.id,
          tenantId: rule.tenantId,
          name: rule.name,
          description: rule.description,
          isActive: rule.isActive,
          priority: rule.priority,
          conditions: rule.conditions,
          actions: rule.actions,
          executionCount: rule.executionCount,
          successCount: rule.successCount,
          lastExecuted: rule.lastExecuted,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt
        })
        .returning();

      return this.mapRowToEntity(created);
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error creating rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async findById(id: string, tenantId: string): Promise<AutomationRuleEntity | null> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rule: ${id} for tenant: ${tenantId}`);

    try {
      const [rule] = await db
        .select()
        .from(schema.omnibridgeRules)
        .where(
          and(
            eq(schema.omnibridgeRules.id, id),
            eq(schema.omnibridgeRules.tenantId, tenantId)
          )
        )
        .limit(1);

      return rule ? this.mapRowToEntity(rule) : null;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async findByTenant(tenantId: string): Promise<AutomationRuleEntity[]> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rules for tenant: ${tenantId}`);

    try {
      const rules = await db
        .select()
        .from(schema.omnibridgeRules)
        .where(eq(schema.omnibridgeRules.tenantId, tenantId))
        .orderBy(desc(schema.omnibridgeRules.priority), desc(schema.omnibridgeRules.createdAt));

      return rules.map(rule => this.mapRowToEntity(rule));
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding rules: ${(error as Error).message}`);
      throw error;
    }
  }

  async update(rule: AutomationRuleEntity): Promise<AutomationRuleEntity> {
    try {
      console.log(`🔧 [DrizzleAutomationRuleRepository] Updating rule: ${rule.id}`);

      const [updated] = await db
        .update(schema.omnibridgeRules)
        .set({
          name: rule.name,
          description: rule.description,
          isActive: rule.isActive,
          priority: rule.priority,
          conditions: rule.conditions,
          actions: rule.actions,
          executionCount: rule.executionCount,
          successCount: rule.successCount,
          lastExecuted: rule.lastExecuted,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(schema.omnibridgeRules.id, rule.id),
            eq(schema.omnibridgeRules.tenantId, rule.tenantId)
          )
        )
        .returning();

      return this.mapRowToEntity(updated);
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error updating rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      console.log(`🗑️ [DrizzleAutomationRuleRepository] Deleting rule: ${id}`);

      const result = await db
        .delete(schema.omnibridgeRules)
        .where(
          and(
            eq(schema.omnibridgeRules.id, id),
            eq(schema.omnibridgeRules.tenantId, tenantId)
          )
        );

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
      row.conditions || [],
      row.actions || [],
      row.tenantId,
      row.description,
      row.isActive,
      row.priority,
      row.executionCount,
      row.successCount,
      row.lastExecuted,
      row.createdAt,
      row.updatedAt
    );
  }
}