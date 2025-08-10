import { CreateTicketUseCase } from '../use-cases/CreateTicketUseCase';
import { GetTicketsUseCase } from '../use-cases/GetTicketsUseCase'; // Assuming GetTicketsUseCase is imported

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: string;
  customerId: string;
}

export interface CreateTicketResponse {
  success: boolean;
  ticketId?: string;
  message?: string;
}

export class TicketController {
  constructor(
    private readonly getTicketsUseCase: GetTicketsUseCase,
    private readonly createTicketUseCase: CreateTicketUseCase
  ) {}

  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    try {
      const result = await this.createTicketUseCase.execute(request);

      return {
        success: true,
        ticketId: result.id
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async getAllTickets(options: {
    tenantId: string;
    userId?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    companyId?: string;
  }) {
    try {
      return await this.getTicketsUseCase.execute(options);
    } catch (error) {
      console.error('Error in getAllTickets:', error);
      throw error;
    }
  }
}