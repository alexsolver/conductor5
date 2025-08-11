
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { Ticket } from '../../domain/entities/Ticket';

export interface CreateTicketRequest {
  tenantId: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedTo?: string;
}

export class CreateTicketUseCase {
  constructor(private ticketRepository: ITicketRepository) {}

  async execute(request: CreateTicketRequest): Promise<Ticket> {
    const ticket = new Ticket(
      crypto.randomUUID(),
      request.tenantId,
      request.title,
      request.description,
      request.status,
      request.priority,
      request.assignedTo,
      new Date(),
      new Date()
    );

    return await this.ticketRepository.create(ticket);
  }
}
