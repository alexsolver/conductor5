import { Request, Response } from 'express';
import { GetAutomationRulesUseCase } from '../use-cases/GetAutomationRulesUseCase';
import { CreateAutomationRuleUseCase } from '../use-cases/CreateAutomationRuleUseCase';
import { UpdateAutomationRuleUseCase } from '../use-cases/UpdateAutomationRuleUseCase';
import { DeleteAutomationRuleUseCase } from '../use-cases/DeleteAutomationRuleUseCase';
import { ExecuteAutomationRuleUseCase } from '../use-cases/ExecuteAutomationRuleUseCase';

export class AutomationController {
  constructor(
    private getAutomationRulesUseCase: GetAutomationRulesUseCase,
    private createAutomationRuleUseCase: CreateAutomationRuleUseCase,
    private updateAutomationRuleUseCase: UpdateAutomationRuleUseCase,
    private deleteAutomationRuleUseCase: DeleteAutomationRuleUseCase,
    private executeAutomationRuleUseCase: ExecuteAutomationRuleUseCase
  ) {}

  async getRules(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      if (!tenantId) {
        console.error('❌ [AutomationController] No tenant ID found in request');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const filters = {
        isEnabled: req.query.enabled ? req.query.enabled === 'true' : undefined,
        priority: req.query.priority ? parseInt(req.query.priority as string) : undefined,
        search: req.query.search as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      console.log(`🔍 [AutomationController] Getting automation rules for tenant: ${tenantId}`);

      const result = await this.getAutomationRulesUseCase.execute(tenantId, filters);

      // ✅ 1QA.MD: Garantir que os dados sejam retornados no formato correto para o frontend
      const formattedRules = result.rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        conditions: rule.conditions || { rules: [], logicalOperator: 'AND' },
        actions: rule.actions || [],
        priority: rule.priority || 1,
        aiEnabled: rule.aiEnabled || false,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        executionCount: rule.executionCount || 0,
        successCount: rule.successCount || 0,
        lastExecuted: rule.lastExecuted
      }));

      res.json({
        success: true,
        data: formattedRules,
        total: result.total,
        stats: result.stats
      });
    } catch (error) {
      console.error('❌ [AutomationController] Error getting automation rules:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get automation rules',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        console.error('❌ [AutomationController] No tenant ID found in request');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const ruleData = req.body;
      console.log(`🔧 [AutomationController] Creating rule for tenant: ${tenantId}`, ruleData);

      // Validate and provide default values for required fields
      const rulePayload = {
        name: (ruleData.name && ruleData.name.trim()) || 'Nova Regra',
        description: (ruleData.description && ruleData.description.trim()) || 'Regra criada automaticamente',
        isEnabled: typeof ruleData.isEnabled === 'boolean' ? ruleData.isEnabled : true,
        triggers: Array.isArray(ruleData.triggers) && ruleData.triggers.length > 0 
          ? ruleData.triggers 
          : [{ type: 'message_received', conditions: {} }],
        actions: Array.isArray(ruleData.actions) && ruleData.actions.length > 0 
          ? ruleData.actions 
          : [{ type: 'send_message', parameters: { message: 'Auto-reply message' } }],
        priority: typeof ruleData.priority === 'number' ? ruleData.priority : 0,
        tenantId
      };

      const result = await this.createAutomationRuleUseCase.execute({
        ...rulePayload,
        userId: (req as any).user?.id || 'system'
      });

      res.json({
        success: true,
        data: result,
        message: 'Automation rule created successfully'
      });
    } catch (error) {
      console.error('❌ [AutomationController] Error creating rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create automation rule',
        details: error.message
      });
    }
  }

  async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id || 'system';
      const ruleId = req.params.ruleId;

      if (!tenantId) {
        console.error('❌ [AutomationController] No tenant ID found in request');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`🔧 [AutomationController] Updating automation rule: ${ruleId} for tenant: ${tenantId}`);

      const rule = await this.updateAutomationRuleUseCase.execute(ruleId, tenantId, userId, req.body);

      res.json({
        success: true,
        data: rule,
        message: 'Automation rule updated successfully'
      });
    } catch (error) {
      console.error('❌ [AutomationController] Error updating automation rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update automation rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      const ruleId = req.params.ruleId;

      if (!tenantId) {
        console.error('❌ [AutomationController] No tenant ID found in request');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`🗑️ [AutomationController] Deleting automation rule: ${ruleId} for tenant: ${tenantId}`);

      const success = await this.deleteAutomationRuleUseCase.execute(ruleId, tenantId);

      if (success) {
        res.json({
          success: true,
          message: 'Automation rule deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Automation rule not found'
        });
      }
    } catch (error) {
      console.error('❌ [AutomationController] Error deleting automation rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete automation rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      const ruleId = req.params.ruleId;

      if (!tenantId) {
        console.error('❌ [AutomationController] No tenant ID found in request');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`🔍 [AutomationController] Getting automation rule: ${ruleId} for tenant: ${tenantId}`);

      // Buscar regra individual usando o repository
      const { DrizzleAutomationRuleRepository } = await import('../../infrastructure/repositories/DrizzleAutomationRuleRepository');
      const repository = new DrizzleAutomationRuleRepository();
      const rule = await repository.findById(ruleId, tenantId);

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'Automation rule not found'
        });
        return;
      }

      // ✅ 1QA.MD: Formatar dados da regra para o frontend
      const formattedRule = {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        conditions: rule.conditions || { rules: [], logicalOperator: 'AND' },
        actions: (rule.actions || []).map((action: any) => ({
          id: action.id,
          type: action.type,
          name: action.name,
          description: action.description,
          icon: action.icon,
          color: action.color,
          config: action.config || {},
          priority: action.priority || 1
        })),
        priority: rule.priority || 1,
        aiEnabled: rule.aiEnabled || false,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        executionCount: rule.executionCount || 0,
        successCount: rule.successCount || 0,
        lastExecuted: rule.lastExecuted,
        // ✅ Incluir trigger para compatibilidade com edição
        trigger: rule.conditions || { rules: [], logicalOperator: 'AND' }
      };

      res.json({
        success: true,
        data: formattedRule,
        message: 'Automation rule retrieved successfully'
      });
    } catch (error) {
      console.error('❌ [AutomationController] Error getting automation rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get automation rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async toggleRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id || 'system';
      const ruleId = req.params.ruleId;
      const { isEnabled } = req.body;

      if (!tenantId) {
        console.error('❌ [AutomationController] No tenant ID found in request');
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      console.log(`🔄 [AutomationController] Toggling automation rule: ${ruleId} to ${isEnabled}`);

      const rule = await this.updateAutomationRuleUseCase.execute(ruleId, tenantId, userId, { isEnabled });

      res.json({
        success: true,
        data: rule,
        message: `Automation rule ${isEnabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('❌ [AutomationController] Error toggling automation rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle automation rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      console.log('📋 [AutomationController] Getting automation rule templates');

      const templates = [
        {
          id: 'auto-reply-keywords',
          name: 'Auto Reply on Keywords',
          description: 'Automatically reply to messages containing specific keywords',
          category: 'Customer Service',
          triggers: [{
            type: 'keyword',
            conditions: {
              keywords: ['help', 'support', 'problem'],
              operator: 'or'
            }
          }],
          actions: [{
            type: 'auto_reply',
            parameters: {
              replyTemplate: 'Thank you for contacting us! We have received your message and will respond within 24 hours.',
              replyDelay: 0
            },
            order: 1
          }]
        },
        {
          id: 'urgent-escalation',
          name: 'Urgent Priority Escalation',
          description: 'Escalate urgent messages to management team',
          category: 'Escalation',
          triggers: [{
            type: 'priority_based',
            conditions: {
              priority: ['urgent'],
              operator: 'or'
            }
          }],
          actions: [{
            type: 'send_notification',
            parameters: {
              notifyUsers: ['manager-id'],
              notificationMessage: 'Urgent message received requiring immediate attention',
              notificationChannel: 'email'
            },
            order: 1
          }, {
            type: 'create_ticket',
            parameters: {
              ticketPriority: 'urgent',
              ticketCategory: 'escalated',
              assignToAgent: 'manager-id'
            },
            order: 2
          }]
        },
        {
          id: 'off-hours-autoresponder',
          name: 'Off-Hours Auto Responder',
          description: 'Send automatic responses outside business hours',
          category: 'Availability',
          triggers: [{
            type: 'time_based',
            conditions: {
              timeRange: {
                start: '18:00',
                end: '09:00'
              }
            }
          }],
          actions: [{
            type: 'auto_reply',
            parameters: {
              replyTemplate: 'Thank you for your message. Our business hours are 9 AM to 6 PM. We will respond to your message during our next business day.',
              replyDelay: 0
            },
            order: 1
          }]
        },
        {
          id: 'spam-filter',
          name: 'Spam Detection and Archiving',
          description: 'Automatically detect and archive suspected spam messages',
          category: 'Security',
          triggers: [{
            type: 'content_pattern',
            conditions: {
              contentPattern: '(viagra|casino|lottery|winner|congratulations|free money)',
              operator: 'or'
            }
          }],
          actions: [{
            type: 'add_tags',
            parameters: {
              tagsToAdd: ['spam', 'auto-filtered']
            },
            order: 1
          }, {
            type: 'archive',
            parameters: {},
            order: 2
          }]
        },
        {
          id: 'vip-customer-priority',
          name: 'VIP Customer Priority Handling',
          description: 'Give special treatment to VIP customers',
          category: 'VIP Service',
          triggers: [{
            type: 'sender_pattern',
            conditions: {
              senderPattern: '@vip-domain.com|vip-customer@'
            }
          }],
          actions: [{
            type: 'mark_priority',
            parameters: {
              newPriority: 'high'
            },
            order: 1
          }, {
            type: 'add_tags',
            parameters: {
              tagsToAdd: ['vip', 'priority']
            },
            order: 2
          }, {
            type: 'assign_agent',
            parameters: {
              agentId: 'senior-agent-id'
            },
            order: 3
          }]
        },
        {
          id: 'ai-intelligent-response',
          name: 'Resposta Inteligente com IA',
          description: 'Gera respostas automáticas contextuais usando inteligência artificial',
          category: 'AI & Automation',
          triggers: [{
            type: 'new_message',
            conditions: {}
          }],
          actions: [{
            type: 'ai_response',
            parameters: {
              tone: 'professional',
              language: 'pt-BR',
              customInstructions: 'Responda de forma cordial e profissional, oferecendo ajuda específica baseada no contexto da mensagem.',
              includeOriginalMessage: false,
              template: 'customer_service'
            },
            order: 1
          }]
        },
        {
          id: 'ai-technical-support',
          name: 'Suporte Técnico com IA',
          description: 'Respostas especializadas para questões técnicas usando IA',
          category: 'Technical Support',
          triggers: [{
            type: 'keyword',
            conditions: {
              keywords: ['erro', 'bug', 'problema', 'falha', 'não funciona', 'ajuda técnica'],
              operator: 'or'
            }
          }],
          actions: [{
            type: 'ai_response',
            parameters: {
              tone: 'technical',
              language: 'pt-BR',
              customInstructions: 'Forneça uma resposta técnica detalhada, incluindo possíveis soluções e próximos passos. Seja preciso e objetivo.',
              includeOriginalMessage: true,
              template: 'technical_support'
            },
            order: 1
          }, {
            type: 'add_tags',
            parameters: {
              tagsToAdd: ['technical-support', 'ai-assisted']
            },
            order: 2
          }]
        },
        {
          id: 'ai-sales-response',
          name: 'Resposta de Vendas com IA',
          description: 'Respostas orientadas para vendas e conversão usando IA',
          category: 'Sales & Marketing',
          triggers: [{
            type: 'keyword',
            conditions: {
              keywords: ['preço', 'valor', 'custo', 'orçamento', 'comprar', 'adquirir', 'contrato'],
              operator: 'or'
            }
          }],
          actions: [{
            type: 'ai_response',
            parameters: {
              tone: 'sales',
              language: 'pt-BR',
              customInstructions: 'Responda com foco em vendas, destacando benefícios e valor. Seja persuasivo mas não agressivo. Inclua call-to-action.',
              includeOriginalMessage: false,
              template: 'sales_response'
            },
            order: 1
          }, {
            type: 'add_tags',
            parameters: {
              tagsToAdd: ['sales-opportunity', 'ai-generated']
            },
            order: 2
          }]
        }
      ];

      res.json({
        success: true,
        data: templates,
        message: 'Automation rule templates retrieved successfully'
      });
    } catch (error) {
      console.error('❌ [AutomationController] Error getting templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get automation rule templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}