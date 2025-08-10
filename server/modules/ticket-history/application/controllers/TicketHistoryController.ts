import { CreateTicketHistoryUseCase } from '../use-cases/CreateTicketHistoryUseCase';
import { CreateTicketHistoryDTO, TicketHistoryResponseDTO } from '../dto/CreateTicketHistoryDTO';

export class TicketHistoryController {
  constructor(
    private createTicketHistoryUseCase: CreateTicketHistoryUseCase
  ) {}

  async create(dto: CreateTicketHistoryDTO): Promise<TicketHistoryResponseDTO> {
    // Controller only handles HTTP concerns - delegates business logic to use case
    const ticketHistory = await this.createTicketHistoryUseCase.execute(dto);

    // Simple DTO mapping - no business logic
    return {
      id: ticketHistory.id,
      ticketId: ticketHistory.ticketId,
      action: ticketHistory.action,
      description: ticketHistory.description,
      userId: ticketHistory.userId,
      createdAt: ticketHistory.createdAt.toISOString(),
      metadata: ticketHistory.metadata
    };
  }

  // Direct repository access removed - should be handled by a dedicated GetTicketHistoryUseCase
}