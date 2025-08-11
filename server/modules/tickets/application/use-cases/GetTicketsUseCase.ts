
interface GetTicketsRequest {
  tenantId: string;
  userId: string;
  filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    customerId?: string;
    limit?: number;
    offset?: number;
  };
}

interface GetTicketsResponse {
  success: boolean;
  data: any[];
  total: number;
  message?: string;
}

export class GetTicketsUseCase {
  constructor(
    private ticketRepository: any // Should be injected ITicketRepository
  ) {}

  async execute(request: GetTicketsRequest): Promise<GetTicketsResponse> {
    try {
      const { tenantId, filters = {} } = request;

      // Get tickets from repository without presentation logic
      const tickets = await this.ticketRepository.findByTenant(tenantId, filters);
      
      return {
        success: true,
        data: tickets || [],
        total: tickets?.length || 0,
        message: 'Tickets retrieved successfully'
      };
    } catch (error) {
      console.error('Error in GetTicketsUseCase:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: 'Failed to retrieve tickets'
      };
    }
  }
}
