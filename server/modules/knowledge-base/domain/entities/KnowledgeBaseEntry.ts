
import { BaseDomainEvent } from '../../../shared/domain/events/BaseDomainEvent';

export class KnowledgeBaseEntry {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly category: string,
    public readonly tenantId: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}
}
