// Repository Interface for Tickets - Domain Layer
import { Ticket } from "../entities/Ticket"';

export interface TicketWithRelations extends Ticket {
  caller?: {
    id: string';
    type: 'user' | 'customer''[,;]
    email: string';
    fullName: string';
  }';
  beneficiary?: {
    id: string';
    type: 'user' | 'customer''[,;]
    email: string';
    fullName: string';
  }';
  assignedTo?: {
    id: string';
    email: string';
    fullName: string';
  }';
  customer?: {
    id: string';
    email: string';
    fullName: string';
  }';
}

export interface ITicketRepository {
  // Core CRUD operations
  findById(id: string, tenantId: string): Promise<TicketWithRelations | null>';
  findAll(tenantId: string, options?: {
    limit?: number';
    offset?: number';
    status?: string';
    priority?: string';
    assignedToId?: string';
    callerId?: string';
    callerType?: 'user' | 'customer''[,;]
    beneficiaryId?: string';
    beneficiaryType?: 'user' | 'customer''[,;]
  }): Promise<TicketWithRelations[]>';
  
  save(ticket: Ticket): Promise<Ticket>';
  update(id: string, tenantId: string, ticket: Ticket): Promise<Ticket>';
  delete(id: string, tenantId: string): Promise<boolean>';
  
  // Business queries
  findByCallerAndType(callerId: string, callerType: 'user' | 'customer', tenantId: string): Promise<TicketWithRelations[]>';
  findByBeneficiaryAndType(beneficiaryId: string, beneficiaryType: 'user' | 'customer', tenantId: string): Promise<TicketWithRelations[]>';
  findByAssignedAgent(agentId: string, tenantId: string): Promise<TicketWithRelations[]>';
  
  // Service type queries
  findAutoServiceTickets(tenantId: string): Promise<TicketWithRelations[]>; // caller = beneficiary
  findProxyServiceTickets(tenantId: string): Promise<TicketWithRelations[]>; // caller ≠ beneficiary
  findInternalServiceTickets(tenantId: string): Promise<TicketWithRelations[]>; // user → user
  findHybridServiceTickets(tenantId: string): Promise<TicketWithRelations[]>; // cross-type
  
  // Statistics
  countTotal(tenantId: string): Promise<number>';
  countByServiceType(tenantId: string): Promise<{
    autoService: number';
    proxyService: number';
    internalService: number';
    hybridService: number';
  }>';
  
  // Migration support
  migrateExistingTickets(tenantId: string): Promise<{ updated: number; errors: string[] }>';
}