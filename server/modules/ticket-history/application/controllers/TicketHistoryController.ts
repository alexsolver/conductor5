import { CreateTicketHistoryUseCase } from '../use-cases/CreateTicketHistoryUseCase';
import { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository';
import { CreateTicketHistoryDTO, TicketHistoryResponseDTO } from '../dto/CreateTicketHistoryDTO';

export class TicketHistoryController {
  constructor(
    private createTicketHistoryUseCase: CreateTicketHistoryUseCase,
    private ticketHistoryRepository: ITicketHistoryRepository
  ) {}

  async create(dto: CreateTicketHistoryDTO): Promise<TicketHistoryResponseDTO> {
    const ticketHistory = await this.createTicketHistoryUseCase.execute(dto);

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

  async getByTicketId(ticketId: string): Promise<any[]> { // Assuming ITicketHistory[] return type for simplicity
    const history = await this.ticketHistoryRepository.findByTicketId(ticketId);
    return history.map(item => ({
      id: item.id,
      ticketId: item.ticketId,
      action: item.action,
      description: item.description,
      userId: item.userId,
      createdAt: item.createdAt.toISOString(),
      metadata: item.metadata
    }));
  }
}