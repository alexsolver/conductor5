/**
 * APPLICATION LAYER - UPDATE TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Ticket } from '../../domain/entities/Ticket';
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { UpdateTicketDTO } from '../dto/CreateTicketDTO';
import { Logger } from 'aws-lambda-logger';

export class UpdateTicketUseCase {
  // Em um cenário real, o repository e o logger seriam injetados via dependência
  // Assumindo que 'this.repository' e 'this.logger' estão disponíveis e são instâncias corretas
  private repository: ITicketRepository;
  private logger: Logger;

  constructor(
    ticketRepository: ITicketRepository,
    logger: Logger
  ) {
    this.repository = ticketRepository;
    this.logger = logger;
  }

  async execute(ticketId: string, dto: UpdateTicketDTO, tenantId: string): Promise<Ticket> {
    // Validação de entrada
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    if (!dto.updatedById) {
      throw new Error('Updated by user ID is required');
    }

    // Buscar ticket existente
    const existingTicket = await this.repository.findById(ticketId, tenantId);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    // Verificar se ticket está ativo (campo pode não existir em todos os schemas)
    if (existingTicket.isActive === false) {
      throw new Error('Cannot update inactive ticket');
    }

    // Preparar dados para atualização
    const updateData: Partial<Ticket> = {
      updatedById: dto.updatedById
    };

    // Aplicar campos opcionais apenas se fornecidos
    if (dto.subject !== undefined) {
      updateData.subject = dto.subject.trim();
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description.trim();
    }

    if (dto.priority !== undefined) {
      updateData.priority = dto.priority;
    }

    if (dto.urgency !== undefined) {
      updateData.urgency = dto.urgency;
    }

    if (dto.impact !== undefined) {
      updateData.impact = dto.impact;
    }

    // Relacionamentos
    if (dto.customerId !== undefined) {
      updateData.customerId = dto.customerId;
    }

    if (dto.beneficiaryId !== undefined) {
      updateData.beneficiaryId = dto.beneficiaryId;
    }

    // Aplicar assignedToId ANTES de status para garantir que as regras sejam avaliadas corretamente
    if (dto.assignedToId !== undefined) {
      updateData.assignedToId = dto.assignedToId;
      // Aplicar regras de atribuição antes de validar status
      await this.applyAssignmentRules(existingTicket, updateData);
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      // Aplicar regras de transição de status APÓS definir assignee
      await this.applyStatusTransitionRules(existingTicket, dto.status, updateData);
    }

    if (dto.companyId !== undefined) {
      updateData.companyId = dto.companyId;
    }

    // Classificação hierárquica
    if (dto.category !== undefined) {
      updateData.category = dto.category;
    }

    if (dto.subcategory !== undefined) {
      updateData.subcategory = dto.subcategory;
    }

    if (dto.action !== undefined) {
      updateData.action = dto.action;
    }

    // Metadata
    if (dto.tags !== undefined) {
      updateData.tags = dto.tags;
    }

    if (dto.customFields !== undefined) {
      updateData.customFields = {
        ...existingTicket.customFields,
        ...dto.customFields
      };
    }

    // Validação básica de dados obrigatórios
    if (updateData.subject !== undefined && (!updateData.subject || updateData.subject.trim().length === 0)) {
      throw new Error('Subject cannot be empty');
    }

    // Persistir as mudanças
    const updatedTicket = await this.repository.update(ticketId, updateData, tenantId);

    if (!updatedTicket) {
      throw new Error('Failed to update ticket');
    }

    return updatedTicket;
  }

  private async applyStatusTransitionRules(
    existingTicket: Ticket,
    newStatus: string,
    updateData: Partial<Ticket>
  ): Promise<void> {
    const oldStatus = existingTicket.status;

    // Regras de transição de status
    switch (newStatus) {
      case 'in_progress':
        // Para 'in_progress', deve ter assignee (verificar se existe no ticket atual OU se está sendo atribuído agora)
        const currentAssignee = updateData.assignedToId !== undefined ? updateData.assignedToId : existingTicket.assignedToId;
        if (!currentAssignee) {
          throw new Error('Ticket must be assigned before moving to in_progress');
        }
        break;

      case 'resolved':
        // Para 'resolved', deve ter assignee e estar em 'in_progress' ou 'open'
        if (!existingTicket.assignedToId && !updateData.assignedToId) {
          throw new Error('Ticket must be assigned before being resolved');
        }
        if (!['open', 'in_progress'].includes(oldStatus)) {
          throw new Error('Ticket can only be resolved from open or in_progress status');
        }
        break;

      case 'closed':
        // Para 'closed', deve estar resolvido primeiro
        if (oldStatus !== 'resolved') {
          throw new Error('Ticket must be resolved before being closed');
        }
        break;

      case 'open':
        // Reabrir ticket
        if (oldStatus === 'closed') {
          // Reset resolution data when reopening
          updateData.customFields = {
            ...existingTicket.customFields,
            resolutionDate: null,
            resolutionNotes: null
          };
        }
        break;
    }
  }

  private async applyAssignmentRules(
    existingTicket: Ticket,
    updateData: Partial<Ticket>
  ): Promise<void> {
    // Se ticket estava 'new' e agora tem assignee, mover para 'open'
    if (existingTicket.status === 'new' && updateData.assignedToId) {
      updateData.status = 'open';
    }

    // Se ticket estava assignado e agora não tem assignee, voltar para 'new' ou 'open'
    if (existingTicket.assignedToId && updateData.assignedToId === null) {
      if (existingTicket.status === 'in_progress') {
        updateData.status = 'open';
      }
    }
  }
}