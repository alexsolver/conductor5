/**
 * APPLICATION LAYER - UPDATE TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Ticket } from '../../domain/entities/Ticket';
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { UpdateTicketDTO } from '../dto/CreateTicketDTO';
import { Logger } from 'aws-lambda-logger';
import { TicketDomainService } from '../../domain/services/TicketDomainService'; // Assuming TicketDomainService is used here

export class UpdateTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private ticketDomainService: TicketDomainService,
    private logger: Logger
  ) {}

  async execute(id: string, dto: UpdateTicketDTO, tenantId: string): Promise<Ticket> {
    try {
      console.log('🎯 [UpdateTicketUseCase] execute called with:', { 
        id, 
        tenantId,
        updateData: JSON.stringify(dto, null, 2)
      });

      // Validação de entrada mais robusta
      if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
        throw new Error('Tenant ID is required and must be a valid string');
      }

      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Ticket ID is required and must be a valid string');
      }

      if (!dto || Object.keys(dto).length === 0) {
        throw new Error('Update data is required');
      }

      // Verificar se o ticket existe
      console.log('🔍 [UpdateTicketUseCase] Checking if ticket exists');
      const existingTicket = await this.ticketRepository.findById(id, tenantId);

      if (!existingTicket) {
        throw new Error('Ticket not found');
      }

      console.log('✅ [UpdateTicketUseCase] Ticket exists, proceeding with update');

      // Validação de regras de negócio
      if (dto.status && existingTicket.status === 'closed' && dto.status !== 'closed') {
        throw new Error('Cannot reopen a closed ticket');
      }

      // Preparar dados para atualização - APENAS campos que foram fornecidos
      const updateData: Partial<Ticket> = {};

      // Processamento seguro de campos string
      if (dto.subject !== undefined && dto.subject !== null && dto.subject !== '') {
        updateData.subject = String(dto.subject).trim();
        if (!updateData.subject) {
          throw new Error('Subject cannot be empty');
        }
      }

      if (dto.description !== undefined && dto.description !== null) {
        updateData.description = String(dto.description).trim();
      }

      // Validação de status
      if (dto.status !== undefined && dto.status !== null && dto.status !== '') {
        const validStatuses = ['new', 'open', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(dto.status)) {
          throw new Error(`Invalid status value: ${dto.status}. Valid values: ${validStatuses.join(', ')}`);
        }
        updateData.status = dto.status;
      }

      // Validação de priority
      if (dto.priority !== undefined && dto.priority !== null && dto.priority !== '') {
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(dto.priority)) {
          throw new Error(`Invalid priority value: ${dto.priority}. Valid values: ${validPriorities.join(', ')}`);
        }
        updateData.priority = dto.priority;
      }

      // Campos opcionais com validação
      if (dto.urgency !== undefined && dto.urgency !== null && dto.urgency !== '') {
        updateData.urgency = String(dto.urgency);
      }

      if (dto.impact !== undefined && dto.impact !== null && dto.impact !== '') {
        updateData.impact = String(dto.impact);
      }

      if (dto.category !== undefined && dto.category !== null && dto.category !== '') {
        updateData.category = String(dto.category);
      }

      if (dto.subcategory !== undefined && dto.subcategory !== null && dto.subcategory !== '') {
        updateData.subcategory = String(dto.subcategory);
      }

      // Campos de relacionamento (podem ser null)
      if (dto.assignedToId !== undefined) {
        updateData.assignedToId = dto.assignedToId || null;
      }

      if (dto.companyId !== undefined) {
        updateData.companyId = dto.companyId || null;
      }

      if (dto.beneficiaryId !== undefined) {
        updateData.beneficiaryId = dto.beneficiaryId || null;
      }

      if (dto.callerId !== undefined) {
        updateData.callerId = dto.callerId || null;
      }

      if (dto.action !== undefined && dto.action !== null && dto.action !== '') {
        updateData.action = String(dto.action);
      }

      if (dto.customerId !== undefined) {
        updateData.customerId = dto.customerId || null;
      }

      // Campos JSON
      if (dto.tags !== undefined) {
        updateData.tags = Array.isArray(dto.tags) ? dto.tags : [];
      }

      if (dto.customFields !== undefined) {
        updateData.customFields = typeof dto.customFields === 'object' && dto.customFields !== null ? dto.customFields : {};
      }

      // Campo de auditoria
      if (dto.updatedById !== undefined) {
        updateData.updatedById = dto.updatedById;
      }

      // Verificar se há dados para atualizar
      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
      }

      console.log('🔧 [UpdateTicketUseCase] Calling repository update with cleaned data:', {
        fieldsToUpdate: Object.keys(updateData),
        updateData
      });

      // Executar atualização via repository
      const updatedTicket = await this.ticketRepository.update(id, updateData, tenantId);

      if (!updatedTicket) {
        throw new Error('Update failed - no ticket returned from repository');
      }

      console.log('✅ [UpdateTicketUseCase] Update completed successfully');
      return updatedTicket;

    } catch (error: any) {
      console.error('❌ [UpdateTicketUseCase] Update failed:', error);
      this.logger.error('Failed to update ticket', { 
        error: error.message, 
        id, 
        tenantId, 
        dto: JSON.stringify(dto) 
      });
      throw error; // Re-throw original error with full context
    }
  }
}