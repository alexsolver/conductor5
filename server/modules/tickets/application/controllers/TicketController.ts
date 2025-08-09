
import { CreateTicketUseCase } from '../use-cases/CreateTicketUseCase';

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
}
