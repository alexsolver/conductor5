// Repository Interface for Tickets - Domain Layer
import { Ticket } from "../entities/Ticket";

export interface TicketWithRelations extends Ticket {
  caller?: {
    id: string;
    type: 'user' | 'customer';
    email: string;
    fullName: string;
  };
  beneficiary?: {
    id: string;
    type: 'user' | 'customer';
    email: string;
    fullName: string;
  };
  assignedTo?: {
    id: string;
    email: string;
    fullName: string;
  };
  customer?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface ITicketRepository {
  findAll(tenantId: string, filters?: any): Promise<Ticket[]>;
  findById(id: string, tenantId: string): Promise<Ticket | null>;
  create(ticket: Ticket): Promise<Ticket>;
  update(id: string, data: Partial<Ticket>, tenantId: string): Promise<Ticket>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByStatus(status: string, tenantId: string): Promise<Ticket[]>;
  findByAssignee(assigneeId: string, tenantId: string): Promise<Ticket[]>;
  
  // Original methods that are not part of the changes
  save(ticket: Ticket): Promise<Ticket>;
  findByCallerAndType(callerId: string, callerType: 'user' | 'customer', tenantId: string): Promise<TicketWithRelations[]>;
  findByBeneficiaryAndType(beneficiaryId: string, beneficiaryType: 'user' | 'customer', tenantId: string): Promise<TicketWithRelations[]>;
  findByAssignedAgent(agentId: string, tenantId: string): Promise<TicketWithRelations[]>;
  findAutoServiceTickets(tenantId: string): Promise<TicketWithRelations[]>; // caller = beneficiary
  findProxyServiceTickets(tenantId: string): Promise<TicketWithRelations[]>; // caller ≠ beneficiary
  findInternalServiceTickets(tenantId: string): Promise<TicketWithRelations[]>; // user → user
  findHybridServiceTickets(tenantId: string): Promise<TicketWithRelations[]>; // cross-type
  countTotal(tenantId: string): Promise<number>;
  countByServiceType(tenantId: string): Promise<{
    autoService: number;
    proxyService: number;
    internalService: number;
    hybridService: number;
  }>;
  migrateExistingTickets(tenantId: string): Promise<{ updated: number; errors: string[] }>;
}