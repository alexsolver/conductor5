// Repository Interface - Dependency Inversion
import { Ticket, TicketStatus, TicketPriority } from "../entities/Ticket";

export interface ITicketRepository {
  findById(id: string, tenantId: string): Promise<Ticket | null>;
  findByTenant(tenantId: string, limit?: number, offset?: number): Promise<Ticket[]>;
  findByCustomer(customerId: string, tenantId: string): Promise<Ticket[]>;
  findByAssignee(assigneeId: string, tenantId: string): Promise<Ticket[]>;
  findByStatus(status: TicketStatus, tenantId: string): Promise<Ticket[]>;
  findUrgent(tenantId: string): Promise<Ticket[]>;
  save(ticket: Ticket): Promise<Ticket>;
  update(ticket: Ticket): Promise<Ticket>;
  delete(id: string, tenantId: string): Promise<boolean>;
  countByTenant(tenantId: string): Promise<number>;
  countByStatus(status: TicketStatus, tenantId: string): Promise<number>;
}