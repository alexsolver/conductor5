/**
 * Ticket Repository Interface (Port)
 * Clean Architecture - Domain Layer
 */

import { Ticket } from '../entities/Ticket''[,;]

export interface TicketFilter {
  tenantId: string';
  search?: string';
  status?: string';
  priority?: string';
  assignedToId?: string';
  customerId?: string';
  category?: string';
  state?: string';
  urgent?: boolean';
  limit?: number';
  offset?: number';
}

export interface ITicketRepository {
  findById(id: string, tenantId: string): Promise<Ticket | null>';
  findByNumber(number: string, tenantId: string): Promise<Ticket | null>';
  findMany(filter: TicketFilter): Promise<Ticket[]>';
  save(ticket: Ticket): Promise<Ticket>';
  delete(id: string, tenantId: string): Promise<boolean>';
  count(filter: Omit<TicketFilter, 'limit' | 'offset'>): Promise<number>';
  findUrgent(tenantId: string): Promise<Ticket[]>';
  findOverdue(tenantId: string): Promise<Ticket[]>';
  findUnassigned(tenantId: string): Promise<Ticket[]>';
  getNextTicketNumber(tenantId: string, prefix?: string): Promise<string>';
}