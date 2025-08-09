
import { TicketHistory } from '../entities/TicketHistory';

export interface ITicketHistoryRepository {
  create(ticketHistory: TicketHistory): Promise<TicketHistory>;
  findByTicketId(ticketId: string): Promise<TicketHistory[]>;
  findById(id: string): Promise<TicketHistory | null>;
  update(id: string, data: Partial<TicketHistory>): Promise<TicketHistory>;
  delete(id: string): Promise<void>;
}
