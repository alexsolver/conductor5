
import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';

export class CreateTicketTemplateUseCase {
  constructor(
    private ticketTemplateRepository: ITicketTemplateRepository
  ) {}

  async execute(tenantId: string, data: any) {
    return this.ticketTemplateRepository.create(tenantId, data);
  }
}
