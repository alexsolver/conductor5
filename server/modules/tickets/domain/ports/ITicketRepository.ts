/**
 * Ticket Repository Interface
 * Clean Architecture - Domain Layer Port
 */

import { Ticket } from '../entities/Ticket';

export interface TicketFilter {
  tenantId: string;
  search?: string;
  status?: string;
  state?: string;
  priority?: string;
  assignedToId?: string;
  customerId?: string;
  category?: string;
  urgent?: boolean;
  limit?: number;
  offset?: number;
}

export interface ITicketRepository {
  findById(id: string, tenantId: string): Promise<Ticket | null>;
  findAll(tenantId: string): Promise<Ticket[]>;
  findMany(filter: TicketFilter): Promise<Ticket[]>;
  save(ticket: Ticket): Promise<Ticket>;
  delete(id: string, tenantId: string): Promise<boolean>;
  count(filter: Omit<TicketFilter, 'limit' | 'offset'>): Promise<number>;
  findUrgent(tenantId: string): Promise<Ticket[]>;
  findOverdue(tenantId: string): Promise<Ticket[]>;
  findUnassigned(tenantId: string): Promise<Ticket[]>;
  getNextTicketNumber(tenantId: string, prefix?: string): Promise<string>;
}