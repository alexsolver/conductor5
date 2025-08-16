import { AutomationRule, AutomationCondition, AutomationAction } from '../../domain/entities/AutomationRule';

export interface AutomationMetrics {
  rulesExecuted: number;
  actionsTriggered: number;
  successRate: number;
  avgExecutionTime: number;
  lastExecution: Date;
}

export class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();
  private metrics: AutomationMetrics = {
    rulesExecuted: 0,
    actionsTriggered: 0,
    successRate: 100,
    avgExecutionTime: 0,
    lastExecution: new Date()
  };

  constructor(private tenantId: string) {
    console.log(`🤖 [AUTOMATION-ENGINE] Initialized for tenant: ${tenantId}`);
    // Carregar regras do banco de dados ao inicializar
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
        const matches = rule.evaluate({ ...data, eventType });

        if (matches) {
          console.log(`✅ [AUTOMATION-ENGINE] Rule "${rule.name}" matched, executing actions...`);

          await rule.execute(data);
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
    this.updateMetrics(executedRules, triggeredActions, executionTime);

    console.log(`📊 [AUTOMATION-ENGINE] Event processed: ${executedRules} rules executed, ${triggeredActions} actions triggered in ${executionTime}ms`);
  }

  private updateMetrics(rulesExecuted: number, actionsTriggered: number, executionTime: number): void {
    this.metrics.rulesExecuted += rulesExecuted;
    this.metrics.actionsTriggered += actionsTriggered;
    this.metrics.avgExecutionTime = (this.metrics.avgExecutionTime + executionTime) / 2;
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

  public async processMessage(messageData: any): Promise<void> {
    try {
      console.log(`📨 [AutomationEngine] Processing message for tenant ${this.tenantId}:`, {
        type: messageData.type,
        content: messageData.content?.substring(0, 100),
        sender: messageData.sender,
        channel: messageData.channel
      });

      const activeRules = Array.from(this.rules.values()).filter(rule => rule.enabled);
      console.log(`🔍 [AutomationEngine] Found ${activeRules.length} active rules to evaluate`);

      for (const rule of activeRules) {
        try {
          const matches = rule.evaluate(messageData);
          
          if (matches) {
            console.log(`✅ [AutomationEngine] Rule "${rule.name}" matched message, executing actions...`);
            
            // Executar ações da regra
            await rule.execute(messageData);
            
            // Atualizar métricas
            this.updateMetrics('execution', true);
            
            console.log(`🎯 [AutomationEngine] Rule "${rule.name}" executed successfully`);
          } else {
            console.log(`⏭️ [AutomationEngine] Rule "${rule.name}" did not match message`);
          }
        } catch (error) {
          console.error(`❌ [AutomationEngine] Error executing rule "${rule.name}":`, error);
          this.updateMetrics('execution', false);
        }
      }

      console.log(`✅ [AutomationEngine] Message processing completed for tenant ${this.tenantId}`);
    } catch (error) {
      console.error(`❌ [AutomationEngine] Error processing message for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Carrega regras do banco de dados para a memória
   */
  public async loadRulesFromDatabase(): Promise<void> {
    try {
      console.log(`📋 [AUTOMATION-ENGINE] Loading rules from database for tenant: ${this.tenantId}`);
      
      const { DrizzleAutomationRuleRepository } = await import('../repositories/DrizzleAutomationRuleRepository');
      const repository = new DrizzleAutomationRuleRepository();
      
      const savedRules = await repository.findByTenantId(this.tenantId);
      console.log(`📋 [AUTOMATION-ENGINE] Found ${savedRules.length} saved rules in database`);
      
      // Converter regras do banco para entidades e adicionar ao engine
      for (const savedRule of savedRules) {
        const { AutomationRule, AutomationCondition, AutomationAction } = await import('../../domain/entities/AutomationRule');
        
        // Converter condições
        const conditions: AutomationCondition[] = savedRule.triggers.map((trigger: any) => ({
          type: trigger.type || 'message_received',
          field: trigger.field || 'content',
          operator: trigger.operator || 'contains',
          value: trigger.value || '',
          condition: trigger.condition || 'equals'
        }));
        
        // Converter ações
        const actions: AutomationAction[] = savedRule.actions.map((action: any) => ({
          type: action.type || 'create_ticket',
          target: action.target || 'system',
          params: action.params || {}
        }));
        
        // Criar regra em memória
        const rule = new AutomationRule(
          savedRule.id,
          savedRule.tenantId,
          savedRule.name,
          savedRule.description || '',
          conditions,
          actions,
          savedRule.isEnabled,
          savedRule.priority || 1
        );
        
        this.rules.set(rule.id, rule);
        console.log(`✅ [AUTOMATION-ENGINE] Loaded rule from DB: ${rule.name} (${rule.id})`);
      }
      
      console.log(`✅ [AUTOMATION-ENGINE] Successfully loaded ${savedRules.length} rules from database`);
    } catch (error) {
      console.error(`❌ [AUTOMATION-ENGINE] Error loading rules from database:`, error);
    }
  }

  /**
   * Sincroniza regra específica do banco para a memória
   */
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
      
      const { AutomationRule, AutomationCondition, AutomationAction } = await import('../../domain/entities/AutomationRule');
      
      // Converter condições
      const conditions: AutomationCondition[] = savedRule.triggers.map((trigger: any) => ({
        type: trigger.type || 'message_received',
        field: trigger.field || 'content',
        operator: trigger.operator || 'contains',
        value: trigger.value || '',
        condition: trigger.condition || 'equals'
      }));
      
      // Converter ações
      const actions: AutomationAction[] = savedRule.actions.map((action: any) => ({
        type: action.type || 'create_ticket',
        target: action.target || 'system',
        params: action.params || {}
      }));
      
      // Criar/atualizar regra em memória
      const rule = new AutomationRule(
        savedRule.id,
        savedRule.tenantId,
        savedRule.name,
        savedRule.description || '',
        conditions,
        actions,
        savedRule.isEnabled,
        savedRule.priority || 1
      );
      
      this.rules.set(rule.id, rule);
      console.log(`✅ [AUTOMATION-ENGINE] Synced rule from DB: ${rule.name} (${rule.id})`);
    } catch (error) {
      console.error(`❌ [AUTOMATION-ENGINE] Error syncing rule from database:`, error);
    }
  }

  public createDefaultRules(): void {
    // Regra 1: Auto-resposta para mensagens específicas
    const autoResponseRule = new AutomationRule(
      'auto-response-keywords',
      this.tenantId,
      'Auto-resposta por palavras-chave',
      'Resposta automática baseada em palavras-chave específicas',
      [
        {
          field: 'message',
          operator: 'contains',
          value: 'suporte'
        }
      ],
      [
        {
          type: 'send_message',
          target: 'telegram',
          params: {
            template: 'auto_response',
            message: 'Olá! Recebemos sua mensagem sobre suporte. Nossa equipe entrará em contato em breve.'
          }
        }
      ]
    );

    // Regra 2: Escalação automática para prioridade alta
    const escalationRule = new AutomationRule(
      'escalate-high-priority',
      this.tenantId,
      'Escalação automática - Alta prioridade',
      'Escala automaticamente tickets de alta prioridade',
      [
        {
          field: 'priority',
          operator: 'equals',
          value: 'high'
        },
        {
          field: 'status',
          operator: 'equals',
          value: 'open',
          logicalOperator: 'AND'
        }
      ],
      [
        {
          type: 'assign_user',
          target: 'manager',
          params: {
            reason: 'high_priority_escalation'
          }
        },
        {
          type: 'send_message',
          target: 'telegram',
          params: {
            message: '🚨 Ticket de alta prioridade escalado: #{ticketId}'
          }
        }
      ],
      true,
      10
    );

    // Regra 3: Tag automática por horário
    const afterHoursRule = new AutomationRule(
      'after-hours-tagging',
      this.tenantId,
      'Marcação fora do horário comercial',
      'Adiciona tag para mensagens recebidas fora do horário comercial',
      [
        {
          field: 'hour',
          operator: 'greaterThan',
          value: 18
        }
      ],
      [
        {
          type: 'add_tag',
          target: 'after_hours',
          params: {
            color: 'orange',
            priority: 'medium'
          }
        }
      ],
      true,
      5
    );

    this.addRule(autoResponseRule);
    this.addRule(escalationRule);
    this.addRule(afterHoursRule);

    console.log(`✅ [AUTOMATION-ENGINE] Created ${this.rules.size} default rules for tenant: ${this.tenantId}`);
  }

  // Métodos para ação:
  private async sendMessage(action: AutomationAction, data: Record<string, any>): Promise<void> {
    try {
      const template = action.params.template;
      const message = this.processTemplate(action.params.message || '', data);

      console.log(`📤 [AUTOMATION] Sending message to ${action.target}:`, { template, message });

      if (action.target === 'telegram') {
        const { GlobalTelegramMetricsManager } = await import('./TelegramMetricsService');
        const metricsManager = GlobalTelegramMetricsManager.getInstance();
        const metricsService = metricsManager.getService(this.tenantId);

        metricsService.logEvent('automation_message_sent', {
          level: 'info',
          success: true,
          metadata: {
            template: template,
            target: action.target,
            ruleId: 'automation-rule'
          }
        });
      }

      if (action.target === 'whatsapp') {
        const { GlobalWhatsAppManager } = await import('./WhatsAppBusinessService');
        const whatsAppManager = GlobalWhatsAppManager.getInstance();
        const whatsAppService = whatsAppManager.getService(this.tenantId);

        // Implementar envio para WhatsApp quando configurado
        console.log(`📱 [AUTOMATION] WhatsApp message prepared:`, { message, template });
      }

    } catch (error) {
      console.error(`❌ [AUTOMATION] Error sending message:`, error);
    }
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    let processedMessage = template;

    // Substituir variáveis no template
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Substituir placeholders padrão
    processedMessage = processedMessage.replace(/{date}/g, new Date().toLocaleDateString('pt-BR'));
    processedMessage = processedMessage.replace(/{time}/g, new Date().toLocaleTimeString('pt-BR'));
    processedMessage = processedMessage.replace(/{timestamp}/g, new Date().toISOString());

    return processedMessage;
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
      engine.createDefaultRules();
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
}