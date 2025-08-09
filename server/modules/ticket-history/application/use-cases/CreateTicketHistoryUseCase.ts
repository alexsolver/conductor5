
import { TicketHistoryEntity } from '../../domain/entities/TicketHistory';
import { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository';

export interface CreateTicketHistoryRequest {
  ticketId: string;
  action: string;
  description: string;
  userId: string;
  metadata?: Record<string, any>;
}

export class CreateTicketHistoryUseCase {
  constructor(private ticketHistoryRepository: ITicketHistoryRepository) {}

  async execute(request: CreateTicketHistoryRequest): Promise<TicketHistoryEntity> {
    const ticketHistory = TicketHistoryEntity.create({
      ticketId: request.ticketId,
      action: request.action,
      description: request.description,
      userId: request.userId,
      metadata: request.metadata
    });

    return await this.ticketHistoryRepository.create(ticketHistory);
  }
}
