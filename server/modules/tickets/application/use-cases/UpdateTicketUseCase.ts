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
    console.log(`🚀 [UpdateTicketUseCase] Starting execution for ticket ${ticketId}`);
    console.log(`📋 [UpdateTicketUseCase] DTO received:`, JSON.stringify(dto, null, 2));
    console.log(`🏢 [UpdateTicketUseCase] Tenant ID: ${tenantId}`);

    // Validação de entrada
    if (!tenantId) {
      console.log('❌ [UpdateTicketUseCase] Tenant ID is missing');
      throw new Error('Tenant ID is required');
    }

    if (!ticketId) {
      console.log('❌ [UpdateTicketUseCase] Ticket ID is missing');
      throw new Error('Ticket ID is required');
    }

    if (!dto.updatedById) {
      console.log('❌ [UpdateTicketUseCase] Updated by user ID is missing');
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

    // ✅ REGRAS DE TRANSIÇÃO MAIS FLEXÍVEIS - Seguindo padrões reais de help desk
    switch (newStatus) {
      case 'in_progress':
        // Para 'in_progress', AUTO-ASSIGN se não estiver assignado
        const assignedToId = updateData.assignedToId || existingTicket.assignedToId;
        if (!assignedToId && updateData.updatedById) {
          // Auto-assign to the user making the update
          updateData.assignedToId = updateData.updatedById;
          console.log(`🔄 [UpdateTicketUseCase] Auto-assigning ticket to updater: ${updateData.updatedById}`);
        }
        break;

      case 'resolved':
        // Para 'resolved', permitir de qualquer status ativo (exceto closed)
        if (oldStatus === 'closed') {
          throw new Error('Cannot resolve a closed ticket. Reopen it first.');
        }
        break;

      case 'closed':
        // Para 'closed', permitir de qualquer status (mais flexível)
        // Não forçar resolved primeiro - alguns tickets podem ser fechados diretamente
        if (oldStatus === 'new') {
          console.log(`⚠️ [UpdateTicketUseCase] Closing ticket directly from 'new' status - unusual but allowed`);
        }
        break;

      case 'open':
        // Reabrir ticket - permitir de qualquer status
        if (oldStatus === 'closed') {
          // Reset resolution data when reopening
          updateData.customFields = {
            ...existingTicket.customFields,
            resolutionDate: null,
            resolutionNotes: null
          };
          console.log(`🔄 [UpdateTicketUseCase] Reopening closed ticket - reset resolution data`);
        }
        break;

      case 'new':
        // Reset para 'new' - limpar assignment se necessário
        if (oldStatus !== 'new') {
          console.log(`🔄 [UpdateTicketUseCase] Resetting ticket to 'new' status`);
        }
        break;
    }
  }

  private async applyAssignmentRules(
    existingTicket: Ticket,
    updateData: Partial<Ticket>
  ): Promise<void> {
    // ✅ REGRAS DE ASSIGNMENT MAIS INTELIGENTES

    // Se ticket estava 'new' e agora tem assignee, mover para 'open'
    if (existingTicket.status === 'new' && updateData.assignedToId) {
      updateData.status = 'open';
      console.log(`🎯 [UpdateTicketUseCase] Auto-moving ticket from 'new' to 'open' due to assignment`);
    }

    // Se ticket estava assignado e agora está sendo desassignado
    if (existingTicket.assignedToId && updateData.assignedToId === null) {
      if (existingTicket.status === 'in_progress') {
        updateData.status = 'open'; // Voltar para open se estava em progresso
        console.log(`🔄 [UpdateTicketUseCase] Moving ticket from 'in_progress' to 'open' due to unassignment`);
      } else if (existingTicket.status === 'open') {
        updateData.status = 'new'; // Voltar para new se estava apenas open
        console.log(`🔄 [UpdateTicketUseCase] Moving ticket from 'open' to 'new' due to unassignment`);
      }
    }

    // Se ticket está sendo assignado e o status atual permite, não forçar mudança de status
    // Deixar o usuário decidir o status explicitamente
  }
}