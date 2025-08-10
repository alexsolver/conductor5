/**
 * Get Ticket History Use Case
 * Clean Architecture - Application Layer
 */

import { TicketHistory } from '../../domain/entities/TicketHistory';
import { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository';

export interface GetTicketHistoryQuery {
  ticketId: string;
}

export class GetTicketHistoryUseCase {
  constructor(private ticketHistoryRepository: ITicketHistoryRepository) {}

  async execute(query: GetTicketHistoryQuery): Promise<TicketHistory[]> {
    return await this.ticketHistoryRepository.findByTicketId(query.ticketId);
  }
}