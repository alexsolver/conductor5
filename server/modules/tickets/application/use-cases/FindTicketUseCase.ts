/**
 * APPLICATION LAYER - FIND TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Ticket } from '../../domain/entities/Ticket';
import { TicketDomainService } from '../../domain/entities/Ticket';
import { ITicketRepository, TicketFilters, PaginationOptions, TicketListResult } from '../../domain/repositories/ITicketRepository';
import { Logger } from '../../domain/services/Logger';

export class FindTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private logger: Logger
  ) {}

  async execute(
    filters: TicketFilters,
    pagination: PaginationOptions,
    tenantId: string
  ): Promise<TicketListResult> {
    try {
      this.logger.info('🔍 [FindTicketUseCase] Executing with filters', { filters, pagination, tenantId });

      const result = await this.ticketRepository.findByFilters(filters, pagination, tenantId);

      this.logger.info('✅ [FindTicketUseCase] Successfully found tickets', {
        count: result.tickets.length,
        total: result.total
      });

      return result;
    } catch (error) {
      this.logger.error('❌ [FindTicketUseCase] Error finding tickets', { error: error.message, tenantId });
      throw new Error(`Failed to find tickets: ${error.message}`);
    }
  }

  async findWithFilters(
    filters: TicketFilters,
    pagination: PaginationOptions,
    tenantId: string
  ): Promise<{
    tickets: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('🎯 [FindTicketUseCase] findWithFilters called with:', { filters, pagination, tenantId });
    this.logger.info('🔍 [FindTicketUseCase] Executing findWithFilters with filters', { filters, pagination, tenantId });

    console.log('🔍 [FindTicketUseCase] Calling repository findWithFilters');
    const result = await this.ticketRepository.findWithFilters(filters, pagination, tenantId);
    console.log('✅ [FindTicketUseCase] Repository returned:', { ticketsCount: result.tickets?.length, total: result.total });

    this.logger.info('✅ [FindTicketUseCase] Successfully found tickets via findWithFilters', {
      count: result.tickets.length,
      total: result.total
    });

    return result;
  }

  async getAllTickets(tenantId: string): Promise<any[]> {
    try {
      this.logger.info('🔍 [FindTicketUseCase] Getting all tickets for tenant', { tenantId });

      const tickets = await this.ticketRepository.findByTenant(tenantId);

      this.logger.info('✅ [FindTicketUseCase] Successfully found all tickets', {
        count: tickets.length,
        tenantId
      });

      return tickets;
    } catch (error) {
      this.logger.error('❌ [FindTicketUseCase] Error getting all tickets', { error: error.message, tenantId });
      throw new Error(`Failed to get all tickets: ${error.message}`);
    }
  }

  async findById(ticketId: string, tenantId: string): Promise<Ticket | null> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    return await this.ticketRepository.findById(ticketId, tenantId);
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