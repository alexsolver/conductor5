
import { TicketHistory } from '../../domain/entities/TicketHistory';
import { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository';

// Renamed to avoid confusion with HTTP request/response objects
export interface CreateTicketHistoryInput {
  ticketId: string;
  action: string;
  description: string;
  userId: string;
  metadata?: Record<string, any>;
}

export class CreateTicketHistoryUseCase {
  constructor(private ticketHistoryRepository: ITicketHistoryRepository) {}

  async execute(input: CreateTicketHistoryInput): Promise<TicketHistory> {
    const ticketHistory = TicketHistory.create({
      ticketId: input.ticketId,
      action: input.action,
      description: input.description,
      userId: input.userId,
      metadata: input.metadata
    });

    return await this.ticketHistoryRepository.create(ticketHistory);
  }
}
