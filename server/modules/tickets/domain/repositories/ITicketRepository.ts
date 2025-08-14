/**
 * DOMAIN LAYER - TICKET REPOSITORY INTERFACE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Ticket } from '../entities/Ticket';

export interface TicketFilters {
  status?: string[];
  priority?: string[];
  assignedToId?: string;
  customerId?: string;
  companyId?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TicketListResult {
  tickets: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ITicketRepository {
  /**
   * Find ticket by ID within tenant scope
   */
  findById(id: string, tenantId: string): Promise<Ticket | null>;
  
  /**
   * Find ticket by number within tenant scope
   */
  findByNumber(number: string, tenantId: string): Promise<Ticket | null>;
  
  /**
   * Create new ticket
   */
  create(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<Ticket>;
  
  /**
   * Update existing ticket
   */
  update(id: string, updates: Partial<Ticket>, tenantId: string): Promise<Ticket>;
  
  /**
   * Soft delete ticket (set isActive = false)
   */
  delete(id: string, tenantId: string): Promise<void>;
  
  /**
   * Find tickets with filters and pagination
   */
  findByFilters(
    filters: TicketFilters, 
    pagination: PaginationOptions, 
    tenantId: string
  ): Promise<TicketListResult>;

  /**
   * Find tickets with filters and pagination (alias for findByFilters)
   */
  findWithFilters(
    filters: TicketFilters, 
    pagination: PaginationOptions, 
    tenantId: string
  ): Promise<TicketListResult>;
  
  /**
   * Find all tickets for a tenant
   */
  findByTenant(tenantId: string): Promise<Ticket[]>;
  
  /**
   * Find tickets assigned to specific user
   */
  findByAssignedUser(userId: string, tenantId: string): Promise<Ticket[]>;
  
  /**
   * Find tickets by customer
   */
  findByCustomer(customerId: string, tenantId: string): Promise<Ticket[]>;
  
  /**
   * Find tickets by status
   */
  findByStatus(status: string, tenantId: string): Promise<Ticket[]>;
  
  /**
   * Count tickets by filters
   */
  countByFilters(filters: TicketFilters, tenantId: string): Promise<number>;
  
  /**
   * Get tickets statistics for dashboard
   */
  getStatistics(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdueCount: number;
    todayCount: number;
  }>;
  
  /**
   * Find tickets that need escalation
   */
  findTicketsForEscalation(tenantId: string): Promise<Ticket[]>;
  
  /**
   * Update last activity timestamp
   */
  updateLastActivity(id: string, tenantId: string): Promise<void>;
  
  /**
   * Bulk update tickets (for batch operations)
   */
  bulkUpdate(
    ids: string[], 
    updates: Partial<Ticket>, 
    tenantId: string
  ): Promise<Ticket[]>;
  
  /**
   * Search tickets by text (subject, description, number)
   */
  searchTickets(
    searchTerm: string, 
    tenantId: string, 
    pagination?: PaginationOptions
  ): Promise<TicketListResult>;
}