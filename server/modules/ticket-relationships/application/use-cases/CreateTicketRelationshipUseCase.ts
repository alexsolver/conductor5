/**
 * CreateTicketRelationshipUseCase - Clean Architecture Implementation
 * Following 1qa.md specifications strictly
 * @module CreateTicketRelationshipUseCase
 */

import { ITicketRelationshipRepository } from '../../domain/repositories/ITicketRelationshipRepository';
import { TicketRelationship } from '../../domain/entities/TicketRelationship';

interface CreateTicketRelationshipRequest {
  tenantId: string;
  sourceTicketId: string;
  targetTicketId: string;
  relationshipType: string;
  description?: string;
  createdBy: string;
}

export class CreateTicketRelationshipUseCase {
  constructor(
    private ticketRelationshipRepository: ITicketRelationshipRepository
  ) {
    console.log('✅ [CreateTicketRelationshipUseCase] Initialized following 1qa.md patterns');
  }

  async execute(request: CreateTicketRelationshipRequest): Promise<TicketRelationship> {
    console.log('📝 [CreateTicketRelationshipUseCase] Creating relationship:', {
      sourceTicketId: request.sourceTicketId,
      targetTicketId: request.targetTicketId,
      relationshipType: request.relationshipType,
      tenantId: request.tenantId
    });

    // Validation following 1qa.md tenant requirements
    if (!request.tenantId) {
      throw new Error('Tenant ID required');
    }

    if (!request.sourceTicketId || !request.targetTicketId) {
      throw new Error('Source and target ticket IDs are required');
    }

    if (!request.relationshipType) {
      throw new Error('Relationship type is required');
    }

    if (!request.createdBy) {
      throw new Error('Created by user ID is required');
    }

    // Prevent self-referencing relationships
    if (request.sourceTicketId === request.targetTicketId) {
      throw new Error('Cannot create relationship between the same ticket');
    }

    try {
      const relationship = await this.ticketRelationshipRepository.create({
        tenantId: request.tenantId,
        sourceTicketId: request.sourceTicketId,
        targetTicketId: request.targetTicketId,
        relationshipType: request.relationshipType,
        description: request.description,
        createdBy: request.createdBy,
        isActive: true
      });

      console.log('✅ [CreateTicketRelationshipUseCase] Relationship created successfully:', relationship.id);
      return relationship;

    } catch (error: any) {
      console.error('❌ [CreateTicketRelationshipUseCase] Error creating relationship:', error);
      throw new Error(`Failed to create relationship: ${error.message}`);
    }
  }
}