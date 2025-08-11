
interface CreateTicketRequest {
  title: string;
  description: string;
  priority: string;
  status?: string;
  customerId?: string;
  categoryId?: string;
  tenantId: string;
  userId: string;
}

interface CreateTicketResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export class CreateTicketUseCase {
  constructor(
    private ticketRepository: any // Should be injected ITicketRepository
  ) {}

  async execute(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    try {
      const { title, description, priority, status = 'open', tenantId, userId, customerId, categoryId } = request;

      // Create ticket through repository without presentation logic
      const ticketData = {
        title,
        description,
        priority,
        status,
        customerId,
        categoryId,
        tenantId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const ticket = await this.ticketRepository.create(ticketData);
      
      return {
        success: true,
        data: ticket,
        message: 'Ticket created successfully'
      };
    } catch (error) {
      console.error('Error in CreateTicketUseCase:', error);
      return {
        success: false,
        message: 'Failed to create ticket'
      };
    }
  }
}
