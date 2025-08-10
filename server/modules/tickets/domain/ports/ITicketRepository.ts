/**
 * Ticket Repository Interface (Port)
 * Clean Architecture - Domain Layer
 */

import { Ticket } from '../entities/Ticket';

export interface ITicketRepository {
  create(ticket: Ticket): Promise<Ticket>;
  findById(id: string, tenantId?: string): Promise<Ticket | null>;
  findAll(): Promise<Ticket[]>;
  update(id: string, ticket: Ticket): Promise<Ticket>;
  delete(id: string): Promise<void>;
  save(ticket: Ticket): Promise<Ticket>;
  getNextTicketNumber(tenantId: string, prefix: string): Promise<string>;
  findByStatus(status: string): Promise<Ticket[]>;
  findByAssignee(assigneeId: string): Promise<Ticket[]>;
  findByCustomer(customerId: string): Promise<Ticket[]>;
}