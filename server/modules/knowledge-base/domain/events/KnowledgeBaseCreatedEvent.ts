
import { BaseDomainEvent } from '../../../shared/domain/events/BaseDomainEvent';

export interface KnowledgeBaseCreatedEventData {
  entryId: string;
  title: string;
  authorId: string;
  tenantId: string;
  createdAt: Date;
}

export class KnowledgeBaseCreatedEvent extends BaseDomainEvent<KnowledgeBaseCreatedEventData> {
  constructor(data: KnowledgeBaseCreatedEventData) {
    super('KnowledgeBaseCreated', data);
  }
}
