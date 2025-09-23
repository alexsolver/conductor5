import { AutomationRule, AutomationTrigger, AutomationAction } from '../../domain/entities/AutomationRule';
import { IAIAnalysisPort, MessageAnalysis } from '../../domain/ports/IAIAnalysisPort';
import { IActionExecutorPort } from '../../domain/ports/IActionExecutorPort';
import { AIAnalysisService } from './AIAnalysisService';
import { ActionExecutor } from './ActionExecutor';

export interface AutomationMetrics {
  rulesExecuted: number;
  actionsTriggered: number;
  successRate: number;
  avgExecutionTime: number;
  aiAnalysisCount: number;
  lastExecution: Date;
}

export class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();
  private aiService: IAIAnalysisPort;
  private actionExecutor: IActionExecutorPort;
  private metrics: AutomationMetrics = {
    rulesExecuted: 0,
    actionsTriggered: 0,
    successRate: 100,
    avgExecutionTime: 0,
    aiAnalysisCount: 0,
    lastExecution: new Date()
  };

  constructor(private tenantId: string, aiService?: IAIAnalysisPort, actionExecutor?: IActionExecutorPort) {
    console.log(`🤖 [AUTOMATION-ENGINE] Initialized for tenant: ${tenantId}`);

    // Usar dependências injetadas ou criar padrão
    this.aiService = aiService || new AIAnalysisService();
    this.actionExecutor = actionExecutor || new ActionExecutor(this.aiService);

    this.loadRulesFromDatabase();
  }

  public addRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule);
    console.log(`✅ [AUTOMATION-ENGINE] Added rule: ${rule.name} (${rule.id})`);
  }

  public removeRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      console.log(`🗑️ [AUTOMATION-ENGINE] Removed rule: ${ruleId}`);
    }
    return deleted;
  }

  public updateRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule);
    console.log(`🔄 [AUTOMATION-ENGINE] Updated rule: ${rule.name} (${rule.id})`);
  }

  public async processMessage(messageData: any): Promise<void> {
    const startTime = Date.now();
    let executedRules = 0;
    let triggeredActions = 0;
    let aiAnalysis: MessageAnalysis | undefined;

    try {
      console.log(`📨 [AUTOMATION-ENGINE] Processing message for tenant ${this.tenantId}:`, {
        sender: messageData.sender || messageData.from,
        channel: messageData.channel || messageData.channelType,
        contentPreview: (messageData.content || messageData.body || '').substring(0, 100)
      });

      // Verificar se alguma regra precisa de análise de IA
      const activeRules = Array.from(this.rules.values()).filter(rule => rule.enabled);
      const aiEnabledRules = activeRules.filter(rule => rule.aiEnabled);

      if (aiEnabledRules.length > 0) {
        console.log(`🤖 [AUTOMATION-ENGINE] ${aiEnabledRules.length} rules require AI analysis`);

        aiAnalysis = await this.aiService.analyzeMessage({
          content: messageData.content || messageData.body,
          sender: messageData.sender || messageData.from,
          subject: messageData.subject,
          channel: messageData.channel || messageData.channelType,
          timestamp: messageData.timestamp
        });

        this.metrics.aiAnalysisCount++;
        console.log(`🧠 [AUTOMATION-ENGINE] AI Analysis complete: ${aiAnalysis.intent} (${aiAnalysis.urgency})`);
      }

      console.log(`🔍 [AUTOMATION-ENGINE] Evaluating ${activeRules.length} active rules`);

      // Ordenar regras por prioridade (maior primeiro)
      const sortedRules = activeRules.sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        try {
          const matches = await rule.evaluate(messageData, aiAnalysis, this.aiService);

          if (matches) {
            console.log(`✅ [AUTOMATION-ENGINE] Rule "${rule.name}" matched, executing actions...`);

            // Execute with detailed monitoring
            const executionStartTime = Date.now();

            try {
              await rule.execute(messageData, aiAnalysis, this.actionExecutor);

              const executionTime = Date.now() - executionStartTime;
              executedRules++;
              triggeredActions += rule.actions.length;

              // Update rule execution stats in database
              await this.updateRuleExecutionStats(rule.id, true, executionTime);

              console.log(`🎯 [AUTOMATION-ENGINE] Rule "${rule.name}" executed successfully in ${executionTime}ms`);
              console.log(`📊 [AUTOMATION-ENGINE] Actions executed: ${rule.actions.map(a => a.type).join(', ')}`);

              // Se a regra tem prioridade alta, pode interromper outras regras
              if (rule.priority >= 8) {
                console.log(`🔝 [AUTOMATION-ENGINE] High priority rule executed, skipping remaining rules`);
                break;
              }
            } catch (executionError) {
              const executionTime = Date.now() - executionStartTime;
              console.error(`❌ [AUTOMATION-ENGINE] Rule "${rule.name}" execution failed after ${executionTime}ms:`, executionError);

              // Update rule execution stats with failure
              await this.updateRuleExecutionStats(rule.id, false, executionTime);

              // Continue with other rules instead of stopping
              continue;
            }
          } else {
            console.log(`⏭️ [AUTOMATION-ENGINE] Rule "${rule.name}" did not match`);
          }
        } catch (error) {
          console.error(`❌ [AUTOMATION-ENGINE] Error executing rule "${rule.name}":`, error);
        }
      }

      // Atualizar métricas
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executedRules, triggeredActions, executionTime, true);

      console.log(`📊 [AUTOMATION-ENGINE] Processing complete: ${executedRules} rules executed, ${triggeredActions} actions in ${executionTime}ms`);
    } catch (error) {
      console.error(`❌ [AUTOMATION-ENGINE] Error processing message:`, error);
      this.updateMetrics(0, 0, Date.now() - startTime, false);
      throw error;
    }
  }

  public async processEvent(eventType: string, data: Record<string, any>): Promise<void> {
    const startTime = Date.now();
    let executedRules = 0;
    let triggeredActions = 0;

    console.log(`🔄 [AUTOMATION-ENGINE] Processing event: ${eventType} for tenant: ${this.tenantId}`);

    // Ordenar regras por prioridade
    const sortedRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        const matches = await rule.evaluate({ ...data, eventType });

        if (matches) {
          console.log(`✅ [AUTOMATION-ENGINE] Rule "${rule.name}" matched event, executing actions...`);

          await rule.execute(data, undefined, this.actionExecutor);
          executedRules++;
          triggeredActions += rule.actions.length;

          console.log(`🎯 [AUTOMATION-ENGINE] Rule "${rule.name}" executed successfully`);
        }
      } catch (error) {
        console.error(`❌ [AUTOMATION-ENGINE] Error executing rule "${rule.name}":`, error);
      }
    }

    // Atualizar métricas
    const executionTime = Date.now() - startTime;
    this.updateMetrics(executedRules, triggeredActions, executionTime, true);

    console.log(`📊 [AUTOMATION-ENGINE] Event processed: ${executedRules} rules executed, ${triggeredActions} actions triggered in ${executionTime}ms`);
  }

  private updateMetrics(rulesExecuted: number, actionsTriggered: number, executionTime: number, success: boolean): void {
    this.metrics.rulesExecuted += rulesExecuted;
    this.metrics.actionsTriggered += actionsTriggered;

    // Calcular taxa de sucesso média
    const totalExecCount = this.metrics.rulesExecuted || 1;
    const successCount = success ? 1 : 0;
    this.metrics.successRate = ((this.metrics.successRate * (totalExecCount - 1)) + (successCount * 100)) / totalExecCount;

    // Calcular tempo médio de execução
    this.metrics.avgExecutionTime = ((this.metrics.avgExecutionTime + executionTime) / 2);
    this.metrics.lastExecution = new Date();
  }

  public getMetrics(): AutomationMetrics {
    return { ...this.metrics };
  }

  public getRules(): AutomationRule[] {
    try {
      const rulesArray = Array.from(this.rules.values());
      console.log(`📋 [AutomationEngine] getRules returning ${rulesArray.length} rules for tenant ${this.tenantId}`);
      return rulesArray || [];
    } catch (error) {
      console.error(`❌ [AutomationEngine] Error getting rules for tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  public getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Update rule execution statistics in database
   */
  private async updateRuleExecutionStats(ruleId: string, success: boolean, executionTime: number): Promise<void> {
    try {
      const { DrizzleAutomationRuleRepository } = await import('../repositories/DrizzleAutomationRuleRepository');
      const repository = new DrizzleAutomationRuleRepository();

      // Get current stats
      const rule = await repository.findById(ruleId, this.tenantId);
      if (!rule) {
        console.warn(`⚠️ [AUTOMATION-ENGINE] Rule ${ruleId} not found for stats update`);
        return;
      }

      const newExecutionCount = (rule.executionCount || 0) + 1;
      const newSuccessCount = (rule.successCount || 0) + (success ? 1 : 0);

      // Update statistics
      await repository.updateExecutionStats(ruleId, this.tenantId, {
        executionCount: newExecutionCount,
        successCount: newSuccessCount,
        lastExecuted: new Date()
      });

      console.log(`📊 [AUTOMATION-ENGINE] Updated stats for rule ${ruleId}: ${newSuccessCount}/${newExecutionCount} success rate`);
    } catch (error) {
      console.error(`❌ [AUTOMATION-ENGINE] Error updating rule stats:`, error);
      // Don't throw - stats update failure shouldn't stop automation
    }
  }

  public async loadRulesFromDatabase(): Promise<void> {
    try {
      console.log(`📋 [AUTOMATION-ENGINE] Loading rules from database for tenant: ${this.tenantId}`);

      const { DrizzleAutomationRuleRepository } = await import('../repositories/DrizzleAutomationRuleRepository');
      const repository = new DrizzleAutomationRuleRepository();

      const savedRules = await repository.findByTenantId(this.tenantId);
      console.log(`📋 [AUTOMATION-ENGINE] Found ${savedRules.length} saved rules in database`);

      // Clear existing rules to avoid duplicates
      this.rules.clear();

      // Converter regras do banco para entidades e adicionar ao engine
      for (const savedRule of savedRules) {
        try {
          // CRITICAL FIX: Parse trigger from database format correctly
          let trigger: AutomationTrigger;

          if (savedRule.trigger && typeof savedRule.trigger === 'object') {
            // Handle new format where trigger is an object
            const triggerData = savedRule.trigger as any;
            trigger = {
              type: triggerData.type || 'message_received',
              conditions: Array.isArray(triggerData.conditions) ? triggerData.conditions.map((condition: any) => ({
                id: condition.id || `condition-${Date.now()}`,
                type: condition.type || 'keyword',
                operator: condition.operator || 'contains',
                value: condition.value || '',
                field: condition.field || 'content',
                caseSensitive: condition.caseSensitive || false,
                aiAnalysisRequired: condition.aiAnalysisRequired || false
              })) : []
            };
          } else if (Array.isArray(savedRule.triggers)) {
            // Handle legacy format where triggers is an array
            trigger = {
              type: savedRule.triggers[0]?.type || 'message_received',
              conditions: savedRule.triggers.map((t: any) => ({
                id: t.id || `condition-${Date.now()}`,
                type: t.type || 'content',
                operator: t.operator || 'contains',
                value: t.value || t.config?.keywords || t.config?.value || '',
                field: t.field || 'content',
                caseSensitive: t.caseSensitive || false,
                aiAnalysisRequired: t.aiAnalysisRequired || false
              }))
            };
          } else {
            // Default fallback
            trigger = {
              type: 'message_received',
              conditions: []
            };
          }

          console.log(`🔧 [AUTOMATION-ENGINE] Converted trigger:`, JSON.stringify(trigger, null, 2));

          // Convert actions
          let actions: AutomationAction[] = [];
          if (Array.isArray(savedRule.actions)) {
            actions = savedRule.actions.map((action: any) => ({
              id: action.id || `action-${Date.now()}`,
              type: action.type || 'auto_reply',
              target: action.target,
              params: action.params || action.config || {},
              aiEnabled: action.aiEnabled || false,
              templateId: action.templateId,
              priority: action.priority || 1
            }));
          }

          console.log(`🔧 [AUTOMATION-ENGINE] Converted actions:`, JSON.stringify(actions, null, 2));

          // Create AutomationRule entity
          const rule = new AutomationRule(
            savedRule.id,
            savedRule.tenantId,
            savedRule.name,
            savedRule.description || '',
            trigger,
            actions,
            savedRule.enabled,
            savedRule.priority || 1,
            savedRule.aiEnabled || false,
            savedRule.aiPromptId,
            savedRule.executionCount || 0,
            savedRule.successCount || 0,
            savedRule.lastExecuted,
            savedRule.createdAt,
            savedRule.updatedAt
          );

          this.rules.set(rule.id, rule);
          console.log(`✅ [AUTOMATION-ENGINE] Added rule to engine: ${rule.name} (${rule.id})`);
        } catch (error) {
          console.error(`❌ [AUTOMATION-ENGINE] Error loading rule ${savedRule.id}:`, error);
        }
      }

      console.log(`📊 [AUTOMATION-ENGINE] Successfully loaded ${this.rules.size} rules into engine`);
    } catch (error) {
      console.error(`❌ [AUTOMATION-ENGINE] Error loading rules from database:`, error);
      // Criar regras padrão se não conseguir carregar do banco
      this.createDefaultRules();
    }
  }

  public async syncRuleFromDatabase(ruleId: string): Promise<void> {
    try {
      console.log(`🔄 [AUTOMATION-ENGINE] Syncing rule ${ruleId} from database`);

      const { DrizzleAutomationRuleRepository } = await import('../repositories/DrizzleAutomationRuleRepository');
      const repository = new DrizzleAutomationRuleRepository();

      const savedRule = await repository.findById(ruleId);
      if (!savedRule || savedRule.tenantId !== this.tenantId) {
        console.log(`⚠️ [AUTOMATION-ENGINE] Rule ${ruleId} not found or not from this tenant`);
        return;
      }

      const trigger: AutomationTrigger = {
        type: savedRule.triggers?.[0]?.type || 'message_received',
        conditions: (savedRule.triggers || []).map((t: any) => ({
          id: t.id || `condition-${Date.now()}`,
          type: t.type || 'content',
          operator: t.operator || 'contains',
          value: t.value || '',
          field: t.field,
          caseSensitive: t.caseSensitive || false,
          aiAnalysisRequired: t.aiAnalysisRequired || false
        }))
      };

      const actions: AutomationAction[] = (savedRule.actions || []).map((action: any, index: number) => ({
        id: action.id || `action-${index}`,
        type: action.type || 'create_ticket',
        target: action.target,
        params: action.params || {},
        priority: action.priority || 0,
        aiEnabled: action.aiEnabled || false,
        templateId: action.templateId
      }));

      // Criar/atualizar regra em memória
      const rule = new AutomationRule(
        savedRule.id,
        savedRule.tenantId,
        savedRule.name,
        savedRule.description || '',
        trigger,
        actions,
        savedRule.isEnabled,
        savedRule.priority || 1,
        savedRule.aiEnabled || false,
        savedRule.aiPromptId,
        savedRule.executionCount || 0,
        savedRule.successCount || 0,
        savedRule.lastExecuted,
        savedRule.createdAt,
        savedRule.updatedAt
      );

      this.rules.set(rule.id, rule);
      console.log(`✅ [AUTOMATION-ENGINE] Synced rule from DB: ${rule.name} (${rule.id})`);
    } catch (error) {
      console.error(`❌ [AUTOMATION-ENGINE] Error syncing rule from database:`, error);
    }
  }

  public createDefaultRules(): void {
    console.log(`🔧 [AUTOMATION-ENGINE] Creating default rules for tenant: ${this.tenantId}`);

    // Regra 1: Análise automática de reclamações com IA
    const aiComplaintRule = new AutomationRule(
      `ai-complaint-analysis-${this.tenantId}`,
      this.tenantId,
      'Análise Inteligente de Reclamações',
      'Detecta automaticamente reclamações usando IA e cria tickets prioritários',
      {
        type: 'ai_analysis',
        conditions: [
          {
            id: 'ai-intent-complaint',
            type: 'ai_intent',
            operator: 'equals',
            value: 'complaint',
            aiAnalysisRequired: true
          },
          {
            id: 'ai-urgency-high',
            type: 'ai_urgency',
            operator: 'equals',
            value: 'high',
            aiAnalysisRequired: true
          }
        ],
        aiEnabled: true
      },
      [
        {
          id: 'create-priority-ticket',
          type: 'create_ticket',
          params: {
            priority: 'high',
            category: 'Reclamação',
            assignToManager: true
          },
          priority: 1
        },
        {
          id: 'send-ai-response',
          type: 'ai_response',
          params: {
            responseType: 'empathetic_acknowledgment'
          },
          priority: 2,
          aiEnabled: true
        }
      ],
      true,
      9,
      true
    );

    // Regra 2: Auto-resposta inteligente para perguntas
    const aiQuestionRule = new AutomationRule(
      `ai-question-response-${this.tenantId}`,
      this.tenantId,
      'Resposta Automática Inteligente',
      'Responde automaticamente perguntas comuns usando análise de IA',
      {
        type: 'ai_analysis',
        conditions: [
          {
            id: 'ai-intent-question',
            type: 'ai_intent',
            operator: 'equals',
            value: 'question',
            aiAnalysisRequired: true
          }
        ],
        aiEnabled: true
      },
      [
        {
          id: 'generate-ai-response',
          type: 'ai_response',
          params: {
            responseType: 'helpful_answer',
            includeNextSteps: true
          },
          priority: 1,
          aiEnabled: true
        }
      ],
      true,
      7,
      true
    );

    // Regra 3: Escalação de emergências
    const emergencyRule = new AutomationRule(
      `emergency-escalation-${this.tenantId}`,
      this.tenantId,
      'Escalação de Emergências',
      'Escalação imediata para mensagens de emergência detectadas por IA',
      {
        type: 'ai_analysis',
        conditions: [
          {
            id: 'ai-intent-emergency',
            type: 'ai_intent',
            operator: 'equals',
            value: 'emergency',
            aiAnalysisRequired: true
          }
        ],
        aiEnabled: true
      },
      [
        {
          id: 'notify-emergency-team',
          type: 'notify_team',
          params: {
            urgency: 'immediate',
            channels: ['email', 'sms', 'phone']
          },
          priority: 1
        },
        {
          id: 'create-critical-ticket',
          type: 'create_ticket',
          params: {
            priority: 'critical',
            category: 'Emergência',
            autoAssign: true
          },
          priority: 2
        }
      ],
      true,
      10,
      true
    );

    // Regra 4: Palavras-chave específicas (método tradicional)
    const keywordRule = new AutomationRule(
      `keyword-support-${this.tenantId}`,
      this.tenantId,
      'Detecção por Palavras-chave',
      'Auto-resposta baseada em palavras-chave específicas',
      {
        type: 'keyword_match',
        conditions: [
          {
            id: 'keyword-suporte',
            type: 'content',
            operator: 'contains',
            value: 'suporte',
            caseSensitive: false
          }
        ]
      },
      [
        {
          id: 'send-support-info',
          type: 'send_auto_reply',
          params: {
            message: 'Olá! Recebemos sua mensagem sobre suporte. Nossa equipe entrará em contato em breve. Para urgências, ligue para (11) 9999-9999.',
            template: 'support_acknowledgment'
          },
          priority: 1
        }
      ],
      true,
      5,
      false
    );

    // Adicionar regras ao engine
    this.addRule(aiComplaintRule);
    this.addRule(aiQuestionRule);
    this.addRule(emergencyRule);
    this.addRule(keywordRule);

    console.log(`✅ [AUTOMATION-ENGINE] Created ${this.rules.size} default rules for tenant: ${this.tenantId}`);
  }

  public getAIService(): IAIAnalysisPort {
    return this.aiService;
  }

  public async testRule(ruleId: string, testMessage: any): Promise<{
    matched: boolean;
    aiAnalysis?: MessageAnalysis;
    executionTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const rule = this.rules.get(ruleId);
      if (!rule) {
        return {
          matched: false,
          executionTime: Date.now() - startTime,
          error: 'Rule not found'
        };
      }

      let aiAnalysis: MessageAnalysis | undefined;

      if (rule.aiEnabled) {
        aiAnalysis = await this.aiService.analyzeMessage(testMessage);
      }

      const matched = await rule.evaluate(testMessage, aiAnalysis, this.aiService);

      return {
        matched,
        aiAnalysis,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        matched: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Singleton global para gerenciar engines por tenant
export class GlobalAutomationManager {
  private static instance: GlobalAutomationManager;
  private engines: Map<string, AutomationEngine> = new Map();

  private constructor() {}

  public static getInstance(): GlobalAutomationManager {
    if (!GlobalAutomationManager.instance) {
      GlobalAutomationManager.instance = new GlobalAutomationManager();
    }
    return GlobalAutomationManager.instance;
  }

  public getEngine(tenantId: string): AutomationEngine {
    if (!this.engines.has(tenantId)) {
      const engine = new AutomationEngine(tenantId);
      this.engines.set(tenantId, engine);
    }
    return this.engines.get(tenantId)!;
  }

  /**
   * Força recarregamento das regras do banco de dados
   */
  public async reloadEngineRules(tenantId: string): Promise<void> {
    const engine = this.getEngine(tenantId);
    await engine.loadRulesFromDatabase();
  }

  /**
   * Sincroniza regra específica
   */
  public async syncRule(tenantId: string, ruleId: string): Promise<void> {
    const engine = this.getEngine(tenantId);
    await engine.syncRuleFromDatabase(ruleId);
  }

  public async processMessage(tenantId: string, messageData: any): Promise<void> {
    const engine = this.getEngine(tenantId);
    return engine.processMessage(messageData);
  }

  public processGlobalEvent(tenantId: string, eventType: string, data: Record<string, any>): Promise<void> {
    const engine = this.getEngine(tenantId);
    return engine.processEvent(eventType, data);
  }

  public getAllMetrics(): Record<string, AutomationMetrics> {
    const metrics: Record<string, AutomationMetrics> = {};
    for (const [tenantId, engine] of this.engines) {
      metrics[tenantId] = engine.getMetrics();
    }
    return metrics;
  }

  public getEngineMetrics(tenantId: string): AutomationMetrics | undefined {
    const engine = this.engines.get(tenantId);
    return engine?.getMetrics();
  }
}