/**
 * Ticket Repository Interface (Port)
 * Clean Architecture - Domain Layer
 */

export interface ITicketRepository {
  create(ticket: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, ticket: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByStatus(status: string): Promise<any[]>;
  findByAssignee(assigneeId: string): Promise<any[]>;
  findByCustomer(customerId: string): Promise<any[]>;
}