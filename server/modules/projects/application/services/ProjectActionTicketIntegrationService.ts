import { ProjectAction } from '../../domain/entities/Project';
import { IProjectActionRepository } from '../../domain/repositories/IProjectRepository';

interface TicketCreationData {
  subject: string;
  description?: string;
  priority: string;
  urgency: string;
  category: string;
  assignedToId?: string;
  relatedProjectId: string;
  relatedActionId: string;
  actionConversionData: {
    originalActionType: string;
    projectName: string;
    actionTitle: string;
    convertedAt: string;
    convertedBy: string;
  };
}

interface ConversionRules {
  autoConvert?: boolean;
  triggerOnStatus?: string[];
  assignToSameUser?: boolean;
  inheritPriority?: boolean;
  copyAttachments?: boolean;
}

export class ProjectActionTicketIntegrationService {
  constructor(
    private actionRepository: IProjectActionRepository
  ) {}

  /**
   * Converte uma Project Action em um Ticket
   */
  async convertActionToTicket(
    actionId: string, 
    tenantId: string, 
    convertedBy: string,
    projectName: string
  ): Promise<TicketCreationData> {
    const action = await this.actionRepository.findById(actionId, tenantId);
    
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    if (action.relatedTicketId) {
      throw new Error(`Action ${actionId} already has a related ticket`);
    }

    const ticketData: TicketCreationData = {
      subject: this.generateTicketSubject(action),
      description: this.generateTicketDescription(action, projectName),
      priority: this.mapActionPriorityToTicketPriority(action.priority),
      urgency: this.mapActionPriorityToTicketUrgency(action.priority),
      category: this.mapActionTypeToTicketCategory(action.type),
      assignedToId: action.assignedToId,
      relatedProjectId: action.projectId,
      relatedActionId: action.id,
      actionConversionData: {
        originalActionType: action.type,
        projectName,
        actionTitle: action.title,
        convertedAt: new Date().toISOString(),
        convertedBy
      }
    };

    console.log('Action converted to ticket:', {
      actionId: action.id,
      actionTitle: action.title,
      ticketSubject: ticketData.subject,
      convertedBy
    });

    return ticketData;
  }

  /**
   * Verifica se uma action deve ser automaticamente convertida
   */
  async shouldAutoConvert(action: ProjectAction): Promise<boolean> {
    const rules = action.ticketConversionRules as ConversionRules;
    
    console.log(`[shouldAutoConvert] Action ${action.id}: rules=`, rules);
    
    if (!rules?.autoConvert) {
      console.log(`[shouldAutoConvert] Action ${action.id}: autoConvert is false or undefined`);
      return false;
    }

    console.log(`[shouldAutoConvert] Action ${action.id}: autoConvert is true, checking triggers`);

    // Verifica se o status atual está na lista de triggers
    if (rules.triggerOnStatus && rules.triggerOnStatus.length > 0) {
      const shouldTrigger = rules.triggerOnStatus.includes(action.status);
      console.log(`[shouldAutoConvert] Action ${action.id}: trigger on status check - current: ${action.status}, triggers: ${JSON.stringify(rules.triggerOnStatus)}, result: ${shouldTrigger}`);
      return shouldTrigger;
    }

    // Conversão automática para ações críticas que ficam bloqueadas
    if (action.priority === 'critical' && action.status === 'blocked') {
      console.log(`[shouldAutoConvert] Action ${action.id}: critical blocked action`);
      return true;
    }

    // Conversão automática para entregas com autoConvert ativado (qualquer status)
    if (action.type === 'delivery' && rules.autoConvert) {
      console.log(`[shouldAutoConvert] Action ${action.id}: delivery with auto-convert enabled`);
      return true;
    }

    // Conversão automática para ações bloqueadas com autoConvert ativado
    if (action.status === 'blocked' && rules.autoConvert) {
      console.log(`[shouldAutoConvert] Action ${action.id}: blocked action with auto-convert enabled`);
      return true;
    }

    // Conversão automática para entregas externas em progresso
    if (action.type === 'external_delivery' && action.status === 'in_progress') {
      console.log(`[shouldAutoConvert] Action ${action.id}: external delivery in progress`);
      return true;
    }

    // Conversão automática para reuniões externas em progresso
    if (action.type === 'external_meeting' && action.status === 'in_progress' && rules.autoConvert) {
      console.log(`[shouldAutoConvert] Action ${action.id}: external meeting in progress with auto-convert`);
      return true;
    }
    
    console.log(`[shouldAutoConvert] Action ${action.id}: type=${action.type}, delivery check=${action.type === 'delivery'}`);
    console.log(`[shouldAutoConvert] Action ${action.id}: autoConvert=${rules.autoConvert}, delivery autoConvert=${action.type === 'delivery' && rules.autoConvert}`);

    // Conversão automática para validações externas
    if (action.type === 'external_validation' && rules.autoConvert) {
      console.log(`[shouldAutoConvert] Action ${action.id}: external validation with auto-convert enabled`);
      return true;
    }

    // Conversão automática para reuniões internas com autoConvert ativado
    if (action.type === 'internal_meeting' && rules.autoConvert) {
      console.log(`[shouldAutoConvert] Action ${action.id}: internal meeting with auto-convert enabled`);
      return true;
    }

    console.log(`[shouldAutoConvert] Action ${action.id}: no auto-convert conditions met`);
    return false;
  }

  /**
   * Atualiza uma action para referenciar o ticket criado
   */
  async linkActionToTicket(
    actionId: string, 
    tenantId: string, 
    ticketId: string
  ): Promise<void> {
    await this.actionRepository.update(actionId, tenantId, {
      relatedTicketId: ticketId,
      updatedAt: new Date()
    });

    console.log('Action linked to ticket:', {
      actionId,
      ticketId
    });
  }

  /**
   * Lista actions que podem ser convertidas em tickets
   */
  async getConvertibleActions(tenantId: string, projectId?: string): Promise<ProjectAction[]> {
    const filters = projectId ? { projectId } : {};
    const actions = await this.actionRepository.findAll(tenantId, filters);
    
    return actions.filter(action => 
      action.canConvertToTicket === 'true' && 
      !action.relatedTicketId &&
      this.isConvertibleType(action.type)
    );
  }

  /**
   * Gera sugestões de integração baseadas no status das actions
   */
  async getIntegrationSuggestions(tenantId: string): Promise<{
    autoConvertCandidates: ProjectAction[];
    blockedActions: ProjectAction[];
    overdueActions: ProjectAction[];
  }> {
    const allActions = await this.actionRepository.findAll(tenantId);
    const now = new Date();

    console.log(`[Integration Suggestions] Processing ${allActions.length} actions for tenant ${tenantId}`);
    console.log(`[Integration Suggestions] Current time: ${now.toISOString()}`);

    const autoConvertCandidates = [];
    const blockedActions = [];
    const overdueActions = [];

    for (const action of allActions) {
      console.log(`[Integration Suggestions] Processing action: ${action.id} - ${action.title}`);
      console.log(`[Integration Suggestions] Status: ${action.status}, DueDate: ${action.dueDate}, CanConvert: ${action.canConvertToTicket}`);
      
      // Candidatos para conversão automática
      if (await this.shouldAutoConvert(action)) {
        console.log(`[Integration Suggestions] Action ${action.id} marked as auto-convert candidate`);
        autoConvertCandidates.push(action);
      }

      // Actions bloqueadas
      if (action.status === 'blocked') {
        console.log(`[Integration Suggestions] Action ${action.id} is blocked`);
        blockedActions.push(action);
      }

      // Actions atrasadas
      if (action.dueDate && new Date(action.dueDate) < now && action.status !== 'completed') {
        const dueDateObj = new Date(action.dueDate);
        console.log(`[Integration Suggestions] Action ${action.id} is overdue: ${dueDateObj.toISOString()} < ${now.toISOString()}`);
        overdueActions.push(action);
      }
    }

    console.log(`[Integration Suggestions] Results: ${autoConvertCandidates.length} auto-convert, ${blockedActions.length} blocked, ${overdueActions.length} overdue`);

    return {
      autoConvertCandidates,
      blockedActions,
      overdueActions
    };
  }

  private generateTicketSubject(action: ProjectAction): string {
    const typeLabels = {
      'internal_meeting': 'Reunião Interna',
      'internal_approval': 'Aprovação Interna', 
      'internal_review': 'Revisão Interna',
      'internal_task': 'Tarefa Interna',
      'external_delivery': 'Entrega Externa',
      'external_validation': 'Validação Externa',
      'external_meeting': 'Reunião com Cliente',
      'external_feedback': 'Feedback Externo',
      'milestone': 'Marco',
      'checkpoint': 'Ponto de Controle'
    };

    return `[${typeLabels[action.type]}] ${action.title}`;
  }

  private generateTicketDescription(action: ProjectAction, projectName: string): string {
    const lines = [
      `Este ticket foi criado automaticamente a partir de uma ação do projeto "${projectName}".`,
      '',
      `**Tipo da Ação:** ${action.type}`,
      `**Status Original:** ${action.status}`,
      `**Prioridade:** ${action.priority}`,
    ];

    if (action.description) {
      lines.push('', '**Descrição Original:**', action.description);
    }

    if (action.notes) {
      lines.push('', '**Notas:**', action.notes);
    }

    if (action.estimatedHours) {
      lines.push('', `**Horas Estimadas:** ${action.estimatedHours}h`);
    }

    if (action.dueDate) {
      lines.push(`**Data de Vencimento:** ${new Date(action.dueDate).toLocaleDateString('pt-BR')}`);
    }

    return lines.join('\n');
  }

  private mapActionPriorityToTicketPriority(actionPriority: string): string {
    const mapping = {
      'low': 'low',
      'medium': 'medium', 
      'high': 'high',
      'critical': 'critical'
    };
    return mapping[actionPriority] || 'medium';
  }

  private mapActionPriorityToTicketUrgency(actionPriority: string): string {
    const mapping = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high', 
      'critical': 'critical'
    };
    return mapping[actionPriority] || 'medium';
  }

  private mapActionTypeToTicketCategory(actionType: string): string {
    const mapping = {
      'internal_meeting': 'meeting',
      'internal_approval': 'approval',
      'internal_review': 'review',
      'internal_task': 'task',
      'external_delivery': 'delivery',
      'external_validation': 'validation',
      'external_meeting': 'meeting',
      'external_feedback': 'feedback',
      'milestone': 'milestone',
      'checkpoint': 'checkpoint'
    };
    return mapping[actionType] || 'task';
  }

  private isConvertibleType(actionType: string): boolean {
    // Tipos que fazem sentido converter para tickets operacionais
    const convertibleTypes = [
      'internal_task',
      'external_delivery',
      'external_validation',
      'milestone',
      'checkpoint'
    ];
    return convertibleTypes.includes(actionType);
  }
}