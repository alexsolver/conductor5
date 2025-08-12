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

  async findWithFilters(
    filters: TicketFilters,
    pagination: PaginationOptions,
    tenantId: string
  ): Promise<TicketListResult> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Validar paginação
    if (pagination.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (pagination.limit < 1 || pagination.limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }

    // Aplicar filtros padrão se necessário
    const normalizedFilters: TicketFilters = {
      ...filters
    };

    // Se não especificado, incluir apenas tickets ativos por padrão
    if (!normalizedFilters.search) {
      // Por padrão, buscar apenas tickets ativos (será aplicado no repository)
    }

    const result = await this.ticketRepository.findByFilters(
      normalizedFilters,
      pagination,
      tenantId
    );

    // Enriquecer dados com informações calculadas
    result.tickets = result.tickets.map(ticket => ({
      ...ticket,
      // Adicionar informações computadas se necessário
    }));

    return result;
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