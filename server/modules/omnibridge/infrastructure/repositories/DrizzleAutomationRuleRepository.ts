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
      console.log(`🔧 [DrizzleAutomationRuleRepository] Rule data:`, JSON.stringify(rule, null, 2));

      const tenantDb = await this.getTenantDb(rule.tenantId);

      // Convert triggers array to single trigger object for storage
      const triggerForStorage = Array.isArray(rule.trigger) && rule.trigger.length > 0 
        ? this.convertFrontendTriggerToStorage(rule.trigger[0])
        : rule.trigger || {};

      console.log(`🔧 [DrizzleAutomationRuleRepository] Converting trigger for storage:`, triggerForStorage);
      console.log(`🔧 [DrizzleAutomationRuleRepository] Actions for storage:`, rule.actions);

      const result = await tenantDb.insert(schema.omnibridgeAutomationRules).values({
        id: rule.id,
        tenantId: rule.tenantId,
        name: rule.name,
        description: rule.description || '',
        trigger: triggerForStorage,
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
      if (updateData.trigger !== undefined) {
        console.log(`🔧 [DrizzleAutomationRuleRepository] RAW updateData.trigger:`, JSON.stringify(updateData.trigger, null, 2));
        console.log(`🔧 [DrizzleAutomationRuleRepository] Is array?`, Array.isArray(updateData.trigger));
        console.log(`🔧 [DrizzleAutomationRuleRepository] Length:`, updateData.trigger?.length);

        // Convert triggers array to single trigger object for storage
        updateObject.trigger = Array.isArray(updateData.trigger) && updateData.trigger.length > 0 
          ? this.convertFrontendTriggerToStorage(updateData.trigger[0])
          : updateData.trigger || {};
        console.log(`🔧 [DrizzleAutomationRuleRepository] Converting update trigger for storage:`, updateObject.trigger);
      }
      if (updateData.actions !== undefined) {
        updateObject.actions = updateData.actions;
        console.log(`🔧 [DrizzleAutomationRuleRepository] Update actions for storage:`, updateData.actions);
      }
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
    const parseJsonField = (field: any, defaultValue: any = {}): any => {
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return parsed !== null ? parsed : defaultValue;
        } catch (e) {
          console.warn(`Failed to parse JSON field: ${field}. Error: ${e}`);
          return defaultValue;
        }
      }
      return field !== null && field !== undefined ? field : defaultValue;
    };

    // Convert backend data to frontend format
    const triggerFromDb = parseJsonField(row.trigger, {});
    const actionsFromDb = parseJsonField(row.actions, []);

    // Convert trigger object to triggers array with proper format for frontend
    let conditions = [];
    if (triggerFromDb && triggerFromDb.conditions && Array.isArray(triggerFromDb.conditions)) {
      // Legacy format: trigger.conditions array -> convert to triggers array
      conditions = triggerFromDb.conditions.map((condition: any, index: number) => ({
        id: condition.id || `trigger_${Date.now()}_${index}`,
        type: condition.type || 'keyword',
        name: this.getDisplayNameForTriggerType(condition.type || 'keyword'),
        description: this.getDescriptionForTriggerType(condition.type || 'keyword'),
        config: {
          keywords: condition.value || condition.keywords || '',
          value: condition.value || condition.keywords || '',
          operator: condition.operator || 'contains',
          field: condition.field || 'content',
          caseSensitive: condition.caseSensitive || false,
          channelType: condition.channelType || ''
        }
      }));
    } else if (triggerFromDb && Object.keys(triggerFromDb).length > 0) {
      // Single trigger object -> convert to triggers array
      conditions = [{
        id: triggerFromDb.id || `trigger_${Date.now()}`,
        type: triggerFromDb.type === 'keyword_match' ? 'keyword' : (triggerFromDb.type || 'keyword'),
        name: this.getDisplayNameForTriggerType(triggerFromDb.type || 'keyword'),
        description: this.getDescriptionForTriggerType(triggerFromDb.type || 'keyword'),
        config: {
          keywords: triggerFromDb.keywords || triggerFromDb.value || '',
          value: triggerFromDb.value || triggerFromDb.keywords || '',
          operator: triggerFromDb.operator || 'contains',
          field: triggerFromDb.field || 'content',
          caseSensitive: triggerFromDb.caseSensitive || false,
          channelType: triggerFromDb.channelType || ''
        }
      }];
    }

    // Convert actions to proper frontend format
    const actionsForFrontend = actionsFromDb.map((action: any, index: number) => ({
      id: action.id || `action_${Date.now()}_${index}`,
      type: action.type === 'send_auto_reply' ? 'auto_reply' : action.type,
      name: this.getDisplayNameForActionType(action.type),
      description: this.getDescriptionForActionType(action.type),
      icon: this.getIconForActionType(action.type),
      color: this.getColorForActionType(action.type),
      config: {
        message: action.params?.message || '',
        template: action.params?.template || '',
        recipient: action.params?.recipient || '',
        priority: action.params?.priority || 'medium',
        ...action.params
      }
    }));

    console.log(`🔧 [DrizzleAutomationRuleRepository] Mapping row to entity:`);
    console.log(`   - Trigger from DB:`, triggerFromDb);
    console.log(`   - Conditions for frontend:`, conditions);
    console.log(`   - Actions for frontend:`, actionsForFrontend);

    return new AutomationRule(
      row.id,
      row.tenantId,
      row.name,
      row.description || '',
      conditions, // Use converted conditions
      actionsForFrontend, // Use converted actions
      row.enabled,
      row.priority || 1,
      row.aiEnabled || false,
      row.aiPromptId,
      row.executionCount || 0,
      row.successCount || 0,
      row.lastExecuted ? new Date(row.lastExecuted) : undefined,
      row.createdAt ? new Date(row.createdAt) : new Date(),
      row.updatedAt ? new Date(row.updatedAt) : new Date()
    );
  }

  // Convert frontend trigger format to database storage format
  private convertFrontendTriggerToStorage(frontendTrigger: any): any {
    console.log(`🔧 [DrizzleAutomationRuleRepository] Converting frontend trigger to storage:`, frontendTrigger);

    // Map frontend trigger types to backend types
    const triggerTypeMapping: Record<string, string> = {
      'keyword': 'keyword_match',
      'channel': 'channel_specific',
      'time': 'time_based',
      'priority': 'priority_based',
      'sender': 'sender_pattern',
      'content': 'content_pattern'
    };

    const backendType = triggerTypeMapping[frontendTrigger.type] || frontendTrigger.type || 'message_received';

    return {
      type: backendType,
      conditions: [{
        id: frontendTrigger.id || `condition-${Date.now()}`,
        type: frontendTrigger.type || 'keyword',
        operator: frontendTrigger.config?.operator || 'contains',
        value: frontendTrigger.config?.keywords || frontendTrigger.config?.value || '',
        field: frontendTrigger.config?.field || 'content',
        caseSensitive: frontendTrigger.config?.caseSensitive || false,
        aiAnalysisRequired: frontendTrigger.config?.aiAnalysisRequired || false
      }]
    };
  }

  private getDisplayNameForTriggerType(type: string): string {
    const mapping: Record<string, string> = {
      'keyword': 'Palavra-chave',
      'keyword_match': 'Palavra-chave',
      'time_based': 'Baseado em tempo',
      'sender_based': 'Baseado no remetente',
      'content_analysis': 'Análise de conteúdo'
    };
    return mapping[type] || 'Gatilho personalizado';
  }

  private getDescriptionForTriggerType(type: string): string {
    const mapping: Record<string, string> = {
      'keyword': 'Ativa quando detecta palavras específicas',
      'keyword_match': 'Ativa quando detecta palavras específicas',
      'time_based': 'Ativa em horários específicos',
      'sender_based': 'Ativa baseado no remetente',
      'content_analysis': 'Ativa baseado na análise do conteúdo'
    };
    return mapping[type] || 'Gatilho personalizado';
  }

  // ✅ 1QA.MD: Métodos auxiliares para mapeamento de dados
  private getDisplayNameForActionType(type: string): string {
    const names: { [key: string]: string } = {
      'auto_reply': 'Resposta automática',
      'send_notification': 'Enviar notificação',
      'create_ticket': 'Criar ticket',
      'forward_message': 'Encaminhar mensagem',
      'add_tags': 'Adicionar tags',
      'assign_agent': 'Atribuir agente',
      'mark_priority': 'Marcar prioridade',
      'ai_response': 'Resposta com IA',
      'escalate': 'Escalar',
      'archive': 'Arquivar'
    };
    return names[type] || type;
  }

  private getDescriptionForActionType(type: string): string {
    const descriptions: { [key: string]: string } = {
      'auto_reply': 'Envia resposta pré-definida',
      'send_notification': 'Notifica equipe responsável',
      'create_ticket': 'Cria ticket automaticamente',
      'forward_message': 'Encaminha para outro agente',
      'add_tags': 'Categoriza com tags',
      'assign_agent': 'Designa agente específico',
      'mark_priority': 'Define nível de prioridade',
      'ai_response': 'Gera resposta usando IA',
      'escalate': 'Escala para supervisor',
      'archive': 'Move para arquivo'
    };
    return descriptions[type] || type;
  }

  private getIconForActionType(type: string): string {
    const icons: { [key: string]: string } = {
      'auto_reply': 'Reply',
      'send_notification': 'Bell',
      'create_ticket': 'FileText',
      'forward_message': 'Forward',
      'add_tags': 'Tag',
      'assign_agent': 'Users',
      'mark_priority': 'Star',
      'ai_response': 'Brain',
      'escalate': 'ArrowRight',
      'archive': 'Archive'
    };
    return icons[type] || 'Settings';
  }

  private getColorForActionType(type: string): string {
    const colors: { [key: string]: string } = {
      'auto_reply': 'bg-blue-500',
      'send_notification': 'bg-yellow-500',
      'create_ticket': 'bg-green-500',
      'forward_message': 'bg-purple-500',
      'add_tags': 'bg-indigo-500',
      'assign_agent': 'bg-teal-500',
      'mark_priority': 'bg-red-500',
      'ai_response': 'bg-pink-500',
      'escalate': 'bg-orange-500',
      'archive': 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  }
}