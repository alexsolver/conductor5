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
    
    if (!rules?.autoConvert) {
      return false;
    }

    // Verifica se o status atual está na lista de triggers
    if (rules.triggerOnStatus && rules.triggerOnStatus.length > 0) {
      return rules.triggerOnStatus.includes(action.status);
    }

    // Conversão automática para ações críticas que ficam bloqueadas
    if (action.priority === 'critical' && action.status === 'blocked') {
      return true;
    }

    // Conversão automática para entregas externas em progresso
    if (action.type === 'external_delivery' && action.status === 'in_progress') {
      return true;
    }

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
      updatedAt: new Date().toISOString()
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

    const autoConvertCandidates = [];
    const blockedActions = [];
    const overdueActions = [];

    for (const action of allActions) {
      // Candidatos para conversão automática
      if (await this.shouldAutoConvert(action)) {
        autoConvertCandidates.push(action);
      }

      // Actions bloqueadas
      if (action.status === 'blocked') {
        blockedActions.push(action);
      }

      // Actions atrasadas
      if (action.dueDate && new Date(action.dueDate) < now && action.status !== 'completed') {
        overdueActions.push(action);
      }
    }

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