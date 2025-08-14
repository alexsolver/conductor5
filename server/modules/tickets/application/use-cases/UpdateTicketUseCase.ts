
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
import { TicketHistoryApplicationService } from '../../../ticket-history/application/services/TicketHistoryApplicationService';
import { DrizzleTicketHistoryRepository } from '../../../ticket-history/infrastructure/repositories/DrizzleTicketHistoryRepository';
import { TicketHistoryDomainService } from '../../../ticket-history/domain/services/TicketHistoryDomainService';

export class UpdateTicketUseCase {
  private historyService: TicketHistoryApplicationService;

  constructor(private ticketRepository: ITicketRepository) {
    console.log('✅ [UpdateTicketUseCase] Initialized with repository');
    
    // Initialize history service following Clean Architecture
    const historyRepository = new DrizzleTicketHistoryRepository();
    const historyDomainService = new TicketHistoryDomainService();
    this.historyService = new TicketHistoryApplicationService(historyRepository, historyDomainService);
    
    console.log('✅ [UpdateTicketUseCase] History service initialized');
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

      // 2. Check if ticket exists and belongs to tenant + capture current state for history
      console.log('🔍 [UpdateTicketUseCase] Checking ticket existence and capturing current state');
      const existingTicket = await this.ticketRepository.findById(ticketId, tenantId);
      
      if (!existingTicket) {
        throw new Error(`Ticket ${ticketId} not found or does not belong to tenant ${tenantId}`);
      }

      console.log('✅ [UpdateTicketUseCase] Ticket found:', existingTicket.id);
      
      // 🎯 CAPTURE CURRENT TICKET STATE FOR HISTORY COMPARISON
      const oldTicketData = { ...existingTicket };
      console.log('📸 [UpdateTicketUseCase] Current ticket state captured for history');
      console.log('📸 [UpdateTicketUseCase] Current ticket state captured for history');

      // 3. Prepare update data following domain rules
      const updateData = {
        ...data,
        updatedById: userId,
        updatedAt: new Date(),
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

      // 5. 🎯 RECORD HISTORY FOLLOWING 1qa.md - COMPREHENSIVE LOGGING
      try {
        console.log('📝 [UpdateTicketUseCase] Recording comprehensive ticket history');
        
        // Get user name for history - simplified approach
        const performedByName = `User ${userId}`;
        
        await this.historyService.recordTicketUpdate(
          ticketId,
          oldTicketData,
          { ...updateData, ...updatedTicket }, // Merge update data with result
          userId,
          performedByName,
          tenantId,
          {
            update_source: 'clean_architecture_use_case',
            request_user_id: userId,
            update_timestamp: new Date().toISOString(),
            total_fields_updated: Object.keys(updateData).length
          }
        );
        
        console.log('✅ [UpdateTicketUseCase] Comprehensive history recorded successfully');
        
      } catch (historyError: any) {
        // Don't fail the entire operation if history fails
        console.error('⚠️ [UpdateTicketUseCase] History recording failed (non-critical):', historyError.message);
      }

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
