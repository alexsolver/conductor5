
import { BaseDomainEvent } from '../../../shared/domain/events/BaseDomainEvent';

export interface KnowledgeBaseUpdatedEventData {
  entryId: string;
  title?: string;
  content?: string;
  updatedBy: string;
  updatedAt: Date;
}

export class KnowledgeBaseUpdatedEvent extends BaseDomainEvent<KnowledgeBaseUpdatedEventData> {
  constructor(data: KnowledgeBaseUpdatedEventData) {
    super('KnowledgeBaseUpdated', data);
  }
}
