/**
 * FindTicketRelationshipsUseCase - Clean Architecture Implementation
 * Following 1qa.md specifications strictly
 * @module FindTicketRelationshipsUseCase
 */

import { ITicketRelationshipRepository } from '../../domain/repositories/ITicketRelationshipRepository';
import { TicketRelationshipWithDetails } from '../../domain/entities/TicketRelationship';

export class FindTicketRelationshipsUseCase {
  constructor(
    private ticketRelationshipRepository: ITicketRelationshipRepository
  ) {
    console.log('✅ [FindTicketRelationshipsUseCase] Initialized with dependencies');
  }

  async findByTicketId(ticketId: string, tenantId: string): Promise<TicketRelationshipWithDetails[]> {
    console.log('🔍 [FindTicketRelationshipsUseCase] Finding relationships for ticket:', { ticketId, tenantId });

    try {
      if (!ticketId) {
        throw new Error('Ticket ID is required');
      }

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const relationships = await this.ticketRelationshipRepository.findRelationshipsByTicketId(ticketId, tenantId);
      
      console.log('✅ [FindTicketRelationshipsUseCase] Found relationships:', relationships.length);
      
      return relationships;

    } catch (error: any) {
      console.error('❌ [FindTicketRelationshipsUseCase] Error finding relationships:', error);
      throw new Error(`Failed to find ticket relationships: ${error.message}`);
    }
  }

  async countByTicketId(ticketId: string, tenantId: string): Promise<number> {
    console.log('📊 [FindTicketRelationshipsUseCase] Counting relationships for ticket:', { ticketId, tenantId });

    try {
      if (!ticketId) {
        throw new Error('Ticket ID is required');
      }

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const count = await this.ticketRelationshipRepository.countRelationshipsByTicketId(ticketId, tenantId);
      
      console.log('✅ [FindTicketRelationshipsUseCase] Relationship count:', count);
      
      return count;

    } catch (error: any) {
      console.error('❌ [FindTicketRelationshipsUseCase] Error counting relationships:', error);
      throw new Error(`Failed to count ticket relationships: ${error.message}`);
    }
  }
}