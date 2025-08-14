/**
 * DeleteTicketRelationshipUseCase - Clean Architecture Implementation
 * Following 1qa.md specifications strictly
 * @module DeleteTicketRelationshipUseCase
 */

import { ITicketRelationshipRepository } from '../../domain/repositories/ITicketRelationshipRepository';

export class DeleteTicketRelationshipUseCase {
  constructor(
    private ticketRelationshipRepository: ITicketRelationshipRepository
  ) {
    console.log('✅ [DeleteTicketRelationshipUseCase] Initialized with dependencies');
  }

  async execute(relationshipId: string, tenantId: string): Promise<boolean> {
    console.log('🗑️ [DeleteTicketRelationshipUseCase] Deleting relationship:', { relationshipId, tenantId });

    try {
      if (!relationshipId) {
        throw new Error('Relationship ID is required');
      }

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const deleted = await this.ticketRelationshipRepository.delete(relationshipId, tenantId);
      
      if (!deleted) {
        throw new Error('Relationship not found or could not be deleted');
      }

      console.log('✅ [DeleteTicketRelationshipUseCase] Relationship deleted successfully:', relationshipId);
      
      return deleted;

    } catch (error: any) {
      console.error('❌ [DeleteTicketRelationshipUseCase] Error deleting relationship:', error);
      throw new Error(`Failed to delete ticket relationship: ${error.message}`);
    }
  }
}