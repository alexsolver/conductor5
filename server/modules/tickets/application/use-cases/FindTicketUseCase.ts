/**
 * APPLICATION LAYER - FIND TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Ticket } from '../../domain/entities/Ticket';
import { TicketDomainService } from '../../domain/entities/Ticket';
import { ITicketRepository, TicketFilters, PaginationOptions, TicketListResult } from '../../domain/repositories/ITicketRepository';

export class FindTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository
  ) {}

  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    return await this.ticketRepository.findById(id, tenantId);
  }

  async findWithFilters(filters: any, pagination: any, tenantId: string): Promise<any> {
    try {
      console.log('[FindTicketUseCase] findWithFilters called with:', { 
        filters, 
        pagination, 
        tenantId,
        hasRepository: !!this.ticketRepository,
        hasFilterMethod: typeof this.ticketRepository.findByFilters === 'function'
      });

      if (!tenantId) {
        throw new Error('Tenant ID is required for ticket search');
      }

      // Tentar usar findByFilters primeiro
      if (typeof this.ticketRepository.findByFilters === 'function') {
        console.log('[FindTicketUseCase] Using findByFilters method');
        const result = await this.ticketRepository.findByFilters(filters, pagination, tenantId);
        console.log('[FindTicketUseCase] findByFilters result:', {
          ticketCount: result.tickets?.length || 0,
          total: result.total,
          page: result.page
        });
        return result;
      }

      // Fallback: usar findByTenant
      console.log('[FindTicketUseCase] Using fallback findByTenant method');
      const tickets = await this.ticketRepository.findByTenant(tenantId);
      console.log('[FindTicketUseCase] findByTenant fallback result:', tickets?.length || 0);

      // Aplicar paginação no fallback
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedTickets = tickets.slice(startIndex, endIndex);

      return {
        tickets: paginatedTickets || [],
        total: tickets?.length || 0,
        page: pagination.page || 1,
        totalPages: Math.ceil((tickets?.length || 0) / pagination.limit) || 1
      };
    } catch (error) {
      console.error('[FindTicketUseCase] Error in findWithFilters:', error);
      console.error('[FindTicketUseCase] Error details:', {
        message: error.message,
        stack: error.stack,
        tenantId,
        filtersProvided: !!filters,
        paginationProvided: !!pagination
      });

      // Tentar recuperação básica
      try {
        console.log('[FindTicketUseCase] Attempting recovery with basic findByTenant');
        const recoveryTickets = await this.ticketRepository.findByTenant(tenantId);
        return {
          tickets: recoveryTickets.slice(0, pagination.limit) || [],
          total: recoveryTickets?.length || 0,
          page: 1,
          totalPages: Math.ceil((recoveryTickets?.length || 0) / pagination.limit) || 1
        };
      } catch (recoveryError) {
        console.error('[FindTicketUseCase] Recovery also failed:', recoveryError);
        return {
          tickets: [],
          total: 0,
          page: pagination.page || 1,
          totalPages: 0
        };
      }
    }
  }

  async findByNumber(ticketNumber: string, tenantId: string): Promise<Ticket | null> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!ticketNumber) {
      throw new Error('Ticket number is required');
    }

    return await this.ticketRepository.findByNumber(ticketNumber, tenantId);
  }

  async findByAssignedUser(userId: string, tenantId: string): Promise<Ticket[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    return await this.ticketRepository.findByAssignedUser(userId, tenantId);
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Ticket[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return await this.ticketRepository.findByCustomer(customerId, tenantId);
  }

  async searchTickets(
    searchTerm: string,
    tenantId: string,
    pagination?: PaginationOptions
  ): Promise<TicketListResult> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    // Limpar e normalizar termo de busca
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (normalizedSearchTerm.length < 2) {
      throw new Error('Search term must have at least 2 characters');
    }

    const defaultPagination: PaginationOptions = {
      page: 1,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    return await this.ticketRepository.searchTickets(
      normalizedSearchTerm,
      tenantId,
      pagination || defaultPagination
    );
  }

  async getStatistics(tenantId: string) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const stats = await this.ticketRepository.getStatistics(tenantId);

    // Enriquecer estatísticas com dados calculados
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

    return {
      ...stats,
      // Adicionar métricas calculadas se necessário
      slaCompliance: stats.total > 0 ?
        Math.round(((stats.total - stats.overdueCount) / stats.total) * 100) :
        100,
      urgentTickets: stats.byPriority?.high || 0 + stats.byPriority?.critical || 0
    };
  }

  async findTicketsForEscalation(tenantId: string): Promise<Ticket[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const tickets = await this.ticketRepository.findTicketsForEscalation(tenantId);

    // Calcular nível de escalação para cada ticket
    return tickets.map(ticket => ({
      ...ticket,
      // Pode adicionar campos computados aqui se necessário
    }));
  }
}