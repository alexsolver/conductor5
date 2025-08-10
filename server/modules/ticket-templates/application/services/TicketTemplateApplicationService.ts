
import { ITicketTemplateRepository } from '../../domain/repositories/ITicketTemplateRepository';

export class TicketTemplateApplicationService {
  constructor(
    private ticketTemplateRepository: ITicketTemplateRepository
  ) {}

  async createTemplate(tenantId: string, data: any) {
    return this.ticketTemplateRepository.create(tenantId, data);
  }

  async getTemplates(tenantId: string) {
    return this.ticketTemplateRepository.findAll(tenantId);
  }
}
