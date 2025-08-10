
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { Ticket } from '../../domain/entities/Ticket';

export interface GetTicketsQuery {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  companyId?: string;
}

export interface GetTicketsResult {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetTicketsUseCase {
  constructor(private ticketRepository: ITicketRepository) {}

  async execute(query: GetTicketsQuery): Promise<GetTicketsResult> {
    const {
      tenantId,
      page = 1,
      limit = 50,
      search,
      status,
      priority,
      assignedToId,
      companyId
    } = query;

    try {
      // Para esta implementação simplificada, vamos retornar uma estrutura básica
      // que pode ser expandida quando o repositório for totalmente implementado
      const tickets = await this.ticketRepository.findAll(tenantId);
      
      // Aplicar filtros se necessário
      let filteredTickets = tickets;
      
      if (search) {
        filteredTickets = filteredTickets.filter(ticket => 
          ticket.getSubject()?.toLowerCase().includes(search.toLowerCase()) ||
          ticket.getDescription()?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (status) {
        filteredTickets = filteredTickets.filter(ticket => ticket.getStatus() === status);
      }
      
      if (priority) {
        filteredTickets = filteredTickets.filter(ticket => ticket.getPriority().getValue() === priority);
      }
      
      if (assignedToId) {
        filteredTickets = filteredTickets.filter(ticket => ticket.getAssignedToId() === assignedToId);
      }
      
      if (companyId) {
        filteredTickets = filteredTickets.filter(ticket => ticket.getCustomerId() === companyId);
      }

      // Paginação
      const total = filteredTickets.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

      return {
        tickets: paginatedTickets,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('❌ Error in GetTicketsUseCase:', error);
      throw new Error('Failed to retrieve tickets');
    }
  }
}
