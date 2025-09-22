import { db, sql, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRule } from '../../domain/entities/AutomationRule';
import { eq, and } from 'drizzle-orm';

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
      const result = await tenantDb.insert(schema.omnibridgeAutomationRules).values({
        id: rule.id,
        tenantId: rule.tenantId,
        name: rule.name,
        description: rule.description || '',
        trigger: rule.trigger,
        actions: rule.actions,
        enabled: rule.enabled,
        priority: rule.priority,
        aiEnabled: rule.aiEnabled || false,
        aiPromptId: rule.aiPromptId,
        executionCount: rule.executionCount || 0,
        successCount: rule.successCount || 0,
        lastExecuted: rule.lastExecuted,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }).returning();

      if (result && result.length > 0) {
        const createdRule = this.mapRowToEntity(result[0]);

        // Registrar regra no engine de automação
        const { GlobalAutomationManager } = await import('../services/AutomationEngine');
        const automationManager = GlobalAutomationManager.getInstance();
        const engine = automationManager.getEngine(rule.tenantId);

        engine.addRule(rule);
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
      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb.select().from(schema.omnibridgeAutomationRules)
        .where(and(eq(schema.omnibridgeAutomationRules.id, id), eq(schema.omnibridgeAutomationRules.tenantId, tenantId)));

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToEntity(result[0]);
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error finding rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async findByTenantId(tenantId: string): Promise<AutomationRule[]> {
    console.log(`🔍 [DrizzleAutomationRuleRepository] Finding rules for tenant: ${tenantId}`);
    
    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select().from(schema.omnibridgeAutomationRules)
      .where(eq(schema.omnibridgeAutomationRules.tenantId, tenantId));

    console.log(`📋 [DrizzleAutomationRuleRepository] Found ${results.length} rules in database`);

    return results.map(rule => this.mapRowToEntity(rule));
  }

  async findByTenant(tenantId: string, filters?: any): Promise<{ rules: any[]; total: number; stats: any }> {
    const rules = await this.findByTenantId(tenantId);
    return {
      rules,
      total: rules.length,
      stats: {
        enabled: rules.filter(r => r.enabled).length,
        disabled: rules.filter(r => !r.enabled).length
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
          COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_rules,
          COUNT(CASE WHEN enabled = false THEN 1 END) as disabled_rules,
          COALESCE(SUM(execution_count), 0) as total_executions
        FROM omnibridge_automation_rules 
        WHERE tenant_id = ${tenantId}
      `);

      const row = result.rows[0];
      return {
        totalRules: parseInt(String(row.total_rules || '0')),
        enabledRules: parseInt(String(row.enabled_rules || '0')),
        disabledRules: parseInt(String(row.disabled_rules || '0')),
        totalExecutions: parseInt(String(row.total_executions || '0'))
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

  async update(id: string, tenantId: string, updateData: Partial<AutomationRule>): Promise<AutomationRule> {
    try {
      console.log(`🔧 [DrizzleAutomationRuleRepository] Updating rule: ${id}`);

      const tenantDb = await this.getTenantDb(tenantId);
      
      // Build update object dynamically based on provided data
      const updateObject: any = {
        updatedAt: new Date()
      };
      
      if (updateData.name !== undefined) updateObject.name = updateData.name;
      if (updateData.description !== undefined) updateObject.description = updateData.description || '';
      if (updateData.enabled !== undefined) updateObject.enabled = updateData.enabled;
      if (updateData.priority !== undefined) updateObject.priority = updateData.priority;
      if (updateData.trigger !== undefined) updateObject.trigger = updateData.trigger;
      if (updateData.actions !== undefined) updateObject.actions = updateData.actions;
      if (updateData.aiEnabled !== undefined) updateObject.aiEnabled = updateData.aiEnabled;
      if (updateData.aiPromptId !== undefined) updateObject.aiPromptId = updateData.aiPromptId;
      
      const result = await tenantDb.update(schema.omnibridgeAutomationRules)
        .set(updateObject)
        .where(and(
          eq(schema.omnibridgeAutomationRules.id, id),
          eq(schema.omnibridgeAutomationRules.tenantId, tenantId)
        ))
        .returning();

      if (result.length > 0) {
        const updatedRule = this.mapRowToEntity(result[0]);
        
        // Sync with automation engine
        try {
          const { GlobalAutomationManager } = await import('../services/AutomationEngine');
          const automationManager = GlobalAutomationManager.getInstance();
          const engine = automationManager.getEngine(tenantId);
          engine.updateRule(updatedRule);
          console.log(`✅ [DrizzleAutomationRuleRepository] Rule synced to engine: ${updatedRule.name}`);
        } catch (syncError) {
          console.error(`⚠️ [DrizzleAutomationRuleRepository] Failed to sync rule to engine:`, syncError);
        }
        
        return updatedRule;
      }

      throw new Error('Rule not found or update failed');
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error updating rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      console.log(`🗑️ [DrizzleAutomationRuleRepository] Deleting rule: ${id}`);

      const tenantDb = await this.getTenantDb(tenantId);
      await tenantDb.delete(schema.omnibridgeAutomationRules)
        .where(and(eq(schema.omnibridgeAutomationRules.id, id), eq(schema.omnibridgeAutomationRules.tenantId, tenantId)));

      return true;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error deleting rule: ${(error as Error).message}`);
      throw error;
    }
  }

  async findActiveByTenant(tenantId: string): Promise<AutomationRule[]> {
    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select().from(schema.omnibridgeAutomationRules)
      .where(and(eq(schema.omnibridgeAutomationRules.tenantId, tenantId), eq(schema.omnibridgeAutomationRules.enabled, true)));

    return results.map(rule => this.mapRowToEntity(rule));
  }

  async toggleStatus(id: string, tenantId: string, enabled: boolean): Promise<AutomationRule | null> {
    try {
      const tenantDb = await this.getTenantDb(tenantId);
      const result = await tenantDb.update(schema.omnibridgeAutomationRules)
        .set({ enabled, updatedAt: new Date() })
        .where(and(eq(schema.omnibridgeAutomationRules.id, id), eq(schema.omnibridgeAutomationRules.tenantId, tenantId)))
        .returning();

      if (result.length > 0) {
        return this.mapRowToEntity(result[0]);
      }
      return null;
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error toggling rule status: ${(error as Error).message}`);
      throw error;
    }
  }

  async updateExecutionStats(id: string, tenantId: string, stats: { executionCount: number; successCount: number; lastExecuted: Date }): Promise<void> {
    try {
      const tenantDb = await this.getTenantDb(tenantId);
      await tenantDb.update(schema.omnibridgeAutomationRules)
        .set({
          executionCount: stats.executionCount,
          successCount: stats.successCount,
          lastExecuted: stats.lastExecuted,
          updatedAt: new Date()
        })
        .where(and(eq(schema.omnibridgeAutomationRules.id, id), eq(schema.omnibridgeAutomationRules.tenantId, tenantId)));
    } catch (error) {
      console.error(`❌ [DrizzleAutomationRuleRepository] Error updating execution stats: ${(error as Error).message}`);
      throw error;
    }
  }

  private mapRowToEntity(row: any): AutomationRule {
    // Parse JSON fields safely
    const parseJsonField = (field: any, defaultValue: any = {}) => {
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
      row.tenant_id || row.tenantId,
      row.name,
      row.description || '',
      parseJsonField(row.trigger, {}),
      parseJsonField(row.actions, []),
      row.enabled,
      row.priority || 1,
      row.ai_enabled || row.aiEnabled || false,
      row.ai_prompt_id || row.aiPromptId,
      row.execution_count || row.executionCount || 0,
      row.success_count || row.successCount || 0,
      row.last_executed || row.lastExecuted,
      row.created_at || row.createdAt,
      row.updated_at || row.updatedAt
    );
  }
}