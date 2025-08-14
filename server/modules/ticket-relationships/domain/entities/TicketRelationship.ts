/**
 * TicketRelationship Domain Entity - Clean Architecture Implementation
 * Following 1qa.md specifications strictly
 * @module TicketRelationshipEntity
 */

export interface TicketRelationship {
  id: string;
  tenantId: string;
  sourceTicketId: string;
  targetTicketId: string;
  relationshipType: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
}

export interface TicketRelationshipWithDetails extends TicketRelationship {
  direction: 'outgoing' | 'incoming';
  relatedTicketId: string;
  relatedTicketNumber?: string;
  relatedTicketSubject?: string;
  relatedTicketStatus?: string;
}