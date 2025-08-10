import { ITicketRepository } from '../../domain/ports/ITicketRepository';

export class GetTicketsUseCase {
  constructor(private ticketRepository: ITicketRepository) {}

  async execute(): Promise<any[]> {
    try {
      return await this.ticketRepository.findAll();
    } catch (error) {
      throw new Error(`Failed to get tickets: ${error.message}`);
    }
  }

  async executeById(id: string): Promise<any> {
    try {
      const ticket = await this.ticketRepository.findById(id);
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      return ticket;
    } catch (error) {
      throw new Error(`Failed to get ticket: ${error.message}`);
    }
  }
}