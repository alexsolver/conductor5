
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
    return Array.from(this.rules.values());
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
          target: 'sender',
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
