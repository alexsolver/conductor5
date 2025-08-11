
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';

export interface GetTicketsRequest {
  tenantId: string;
  filters?: any;
}

export class GetTicketsUseCase {
  constructor(private ticketRepository: ITicketRepository) {}

  async execute(request: GetTicketsRequest): Promise<any[]> {
    return await this.ticketRepository.findByTenant(request.tenantId, request.filters);
  }
}
