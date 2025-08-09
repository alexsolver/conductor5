
import { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository';
import { TicketHistory } from '../../domain/entities/TicketHistory';

export class DrizzleTicketHistoryRepository implements ITicketHistoryRepository {
  async create(ticketHistory: TicketHistory): Promise<TicketHistory> {
    // TODO: Implementar com Drizzle ORM
    throw new Error('Not implemented yet');
  }

  async findByTicketId(ticketId: string): Promise<TicketHistory[]> {
    // TODO: Implementar com Drizzle ORM
    throw new Error('Not implemented yet');
  }

  async findById(id: string): Promise<TicketHistory | null> {
    // TODO: Implementar com Drizzle ORM
    throw new Error('Not implemented yet');
  }

  async update(id: string, data: Partial<TicketHistory>): Promise<TicketHistory> {
    // TODO: Implementar com Drizzle ORM
    throw new Error('Not implemented yet');
  }

  async delete(id: string): Promise<void> {
    // TODO: Implementar com Drizzle ORM
    throw new Error('Not implemented yet');
  }
}
