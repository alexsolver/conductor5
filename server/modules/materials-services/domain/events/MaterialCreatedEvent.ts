
import { BaseDomainEvent } from '../../../shared/domain/events/BaseDomainEvent';

export interface MaterialCreatedEventData {
  materialId: string;
  name: string;
  category: string;
  createdBy: string;
  tenantId: string;
  createdAt: Date;
}

export class MaterialCreatedEvent extends BaseDomainEvent<MaterialCreatedEventData> {
  constructor(data: MaterialCreatedEventData) {
    super('MaterialCreated', data);
  }
}
