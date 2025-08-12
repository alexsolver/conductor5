/**
 * APPLICATION LAYER - UPDATE TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Ticket } from '../../domain/entities/Ticket';
import { TicketDomainService } from '../../domain/entities/Ticket';
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { UpdateTicketDTO } from '../dto/CreateTicketDTO';

export class UpdateTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private ticketDomainService: TicketDomainService
  ) {}

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
    const existingTicket = await this.ticketRepository.findById(ticketId, tenantId);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    // Verificar se ticket está ativo
    if (!existingTicket.isActive) {
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

    if (dto.status !== undefined) {
      updateData.status = dto.status;
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

    if (dto.assignedToId !== undefined) {
      updateData.assignedToId = dto.assignedToId;
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

    // Criar objeto ticket temporário para validação
    const ticketForValidation = {
      ...existingTicket,
      ...updateData
    };

    // Validação de regras de negócio
    this.ticketDomainService.validate(ticketForValidation);

    // Aplicar regras de negócio específicas para mudanças de estado
    if (updateData.status && updateData.status !== existingTicket.status) {
      await this.applyStatusTransitionRules(
        existingTicket,
        updateData.status,
        updateData
      );
    }

    // Aplicar regras para assignment
    if (updateData.assignedToId && updateData.assignedToId !== existingTicket.assignedToId) {
      await this.applyAssignmentRules(existingTicket, updateData);
    }

    // Persistir as mudanças
    const updatedTicket = await this.ticketRepository.update(ticketId, updateData, tenantId);

    // Atualizar timestamp de última atividade
    await this.ticketRepository.updateLastActivity(ticketId, tenantId);

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
        // Para 'in_progress', deve ter assignee
        if (!updateData.assignedToId && !existingTicket.assignedToId) {
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
    if (existingTicket.assignedToId && !updateData.assignedToId) {
      if (existingTicket.status === 'in_progress') {
        updateData.status = 'open';
      }
    }
  }
}