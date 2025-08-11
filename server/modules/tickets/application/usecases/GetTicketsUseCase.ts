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

interface GetTicketsRequest {
  tenantId: string;
  userId: string;
  filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    customerId?: string;
    ticketId?: string;
    limit?: number;
    offset?: number;
  };
}

interface GetTicketsResponse {
  success: boolean;
  data: any[];
  total: number;
  message: string;
}

export class GetTicketsUseCase {
  constructor(
    private ticketRepository: ITicketRepository
  ) {}

  async execute(request: GetTicketsRequest): Promise<GetTicketsResponse> {
    try {
      const { tenantId, filters = {} } = request;

      console.log('🎫 [GetTicketsUseCase] Executing with:', { tenantId, filters });

      // Validate tenant ID
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      // Get tickets from repository
      const tickets = await this.ticketRepository.findByTenant(tenantId, filters);

      console.log('🎫 [GetTicketsUseCase] Repository returned:', tickets?.length || 0, 'tickets');

      return {
        success: true,
        data: tickets || [],
        total: tickets?.length || 0,
        message: 'Tickets retrieved successfully'
      };
    } catch (error) {
      console.error('🎫 [GetTicketsUseCase] Error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to retrieve tickets'
      };
    }
  }
}