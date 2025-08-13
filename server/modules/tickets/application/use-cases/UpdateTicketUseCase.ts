
/**
 * UpdateTicketUseCase - Clean Architecture Implementation
 * Follows 1qa.md specifications exactly
 * 
 * @module UpdateTicketUseCase
 * @created 2025-01-13 - Clean Architecture Phase 1
 */

import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { UpdateTicketDTO } from '../dto/CreateTicketDTO';
import { Ticket } from '../../domain/entities/Ticket';

export class UpdateTicketUseCase {
  constructor(private ticketRepository: ITicketRepository) {
    console.log('✅ [UpdateTicketUseCase] Initialized with repository');
  }

  async execute(ticketId: string, data: UpdateTicketDTO, tenantId: string, userId: string): Promise<Ticket> {
    console.log('🎯 [UpdateTicketUseCase] Starting execution:', { 
      ticketId, 
      tenantId, 
      userId,
      dataKeys: Object.keys(data)
    });

    try {
      // 1. Validate inputs following 1qa.md specs
      if (!ticketId || typeof ticketId !== 'string') {
        throw new Error('Valid ticket ID is required');
      }

      if (!tenantId || typeof tenantId !== 'string') {
        throw new Error('Valid tenant ID is required');
      }

      if (!userId || typeof userId !== 'string') {
        throw new Error('Valid user ID is required');
      }

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Update data is required');
      }

      // 2. Check if ticket exists and belongs to tenant
      console.log('🔍 [UpdateTicketUseCase] Checking ticket existence');
      const existingTicket = await this.ticketRepository.findById(ticketId, tenantId);
      
      if (!existingTicket) {
        throw new Error(`Ticket ${ticketId} not found or does not belong to tenant ${tenantId}`);
      }

      console.log('✅ [UpdateTicketUseCase] Ticket found:', existingTicket.id);

      // 3. Prepare update data following domain rules
      const updateData = {
        ...data,
        updatedById: userId,
        updatedAt: new Date().toISOString(),
        tenantId: tenantId // Ensure tenant consistency
      };

      console.log('📝 [UpdateTicketUseCase] Prepared update data:', {
        fieldsToUpdate: Object.keys(updateData),
        hasUpdatedById: !!updateData.updatedById,
        hasUpdatedAt: !!updateData.updatedAt
      });

      // 4. Execute update via repository
      console.log('💾 [UpdateTicketUseCase] Calling repository update');
      const updatedTicket = await this.ticketRepository.update(ticketId, updateData, tenantId);

      if (!updatedTicket) {
        throw new Error('Failed to update ticket - repository returned null');
      }

      console.log('✅ [UpdateTicketUseCase] Update successful:', {
        ticketId: updatedTicket.id,
        updatedFields: Object.keys(updateData)
      });

      return updatedTicket;

    } catch (error: any) {
      console.error('❌ [UpdateTicketUseCase] Error during execution:', error);
      
      // Re-throw with context for better debugging
      if (error.message.includes('not found')) {
        throw new Error(`Ticket not found: ${error.message}`);
      } else if (error.message.includes('constraint')) {
        throw new Error(`Database constraint violation: ${error.message}`);
      } else if (error.message.includes('required')) {
        throw new Error(`Validation error: ${error.message}`);
      } else {
        throw new Error(`Update failed: ${error.message}`);
      }
    }
  }
}
