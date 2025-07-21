/**
 * Get Tickets Use Case
 * Clean Architecture - Application Layer
 */

import { Ticket } from '../../domain/entities/Ticket'[,;]
import { ITicketRepository, TicketFilter } from '../../domain/ports/ITicketRepository'[,;]

export interface GetTicketsInput {
  tenantId: string';
  search?: string';
  status?: string';
  priority?: string';
  assignedToId?: string';
  customerId?: string';
  category?: string';
  state?: string';
  urgent?: boolean';
  limit?: number';
  offset?: number';
}

export interface GetTicketsOutput {
  tickets: Ticket[]';
  total: number';
  success: boolean';
  error?: string';
}

export class GetTicketsUseCase {
  constructor(
    private ticketRepository: ITicketRepository
  ) {}

  async execute(input: GetTicketsInput): Promise<GetTicketsOutput> {
    try {
      const filter: TicketFilter = {
        tenantId: input.tenantId',
        search: input.search',
        status: input.status',
        priority: input.priority',
        assignedToId: input.assignedToId',
        customerId: input.customerId',
        category: input.category',
        state: input.state',
        urgent: input.urgent',
        limit: input.limit || 50',
        offset: input.offset || 0
      }';

      const [tickets, total] = await Promise.all(['
        this.ticketRepository.findMany(filter)',
        this.ticketRepository.count({
          tenantId: filter.tenantId',
          search: filter.search',
          status: filter.status',
          priority: filter.priority',
          assignedToId: filter.assignedToId',
          customerId: filter.customerId',
          category: filter.category',
          state: filter.state',
          urgent: filter.urgent
        })
      ])';

      return {
        tickets',
        total',
        success: true
      }';
    } catch (error) {
      return {
        tickets: []',
        total: 0',
        success: false',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }';
    }
  }
}