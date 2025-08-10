
import { Ticket } from '../../domain/entities/Ticket';

export interface ITicketApplicationRepository {
  findById(id: string, tenantId: string): Promise<Ticket | null>;
  findAll(tenantId: string): Promise<Ticket[]>;
  findByStatus(status: string, tenantId: string): Promise<Ticket[]>;
  findByAssignee(assigneeId: string, tenantId: string): Promise<Ticket[]>;
  findByCompany(companyId: string, tenantId: string): Promise<Ticket[]>;
  search(query: string, tenantId: string): Promise<Ticket[]>;
  create(ticket: Ticket): Promise<Ticket>;
  update(id: string, updates: Partial<Ticket>, tenantId: string): Promise<Ticket | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  count(tenantId: string): Promise<number>;
}
