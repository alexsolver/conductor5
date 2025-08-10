
import { ITicketRepository } from '../../domain/ports/ITicketRepository';
import { Ticket } from '../../domain/entities/Ticket';

export interface GetTicketsParams {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  companyId?: string;
}

export class GetTicketsUseCase {
  constructor(private readonly ticketRepository: ITicketRepository) {}

  async execute(params: GetTicketsParams): Promise<{
    tickets: Ticket[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const tickets = await this.ticketRepository.findMany({
      tenantId: params.tenantId,
      search: params.search,
      status: params.status,
      priority: params.priority,
      assignedToId: params.assignedToId,
      companyId: params.companyId,
      limit,
      offset
    });

    const total = await this.ticketRepository.count({
      tenantId: params.tenantId,
      search: params.search,
      status: params.status,
      priority: params.priority,
      assignedToId: params.assignedToId,
      companyId: params.companyId
    });

    return {
      tickets,
      total,
      page,
      limit
    };
  }
}
