/**
 * ITicketRelationshipRepository Interface - Clean Architecture Implementation
 * Following 1qa.md specifications strictly
 * @module ITicketRelationshipRepository
 */

import { TicketRelationship, TicketRelationshipWithDetails } from '../entities/TicketRelationship';

export interface ITicketRelationshipRepository {
  findRelationshipsByTicketId(ticketId: string, tenantId: string): Promise<TicketRelationshipWithDetails[]>;
  countRelationshipsByTicketId(ticketId: string, tenantId: string): Promise<number>;
  create(relationship: Omit<TicketRelationship, 'id' | 'createdAt' | 'updatedAt'>): Promise<TicketRelationship>;
  findById(id: string, tenantId: string): Promise<TicketRelationship | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}