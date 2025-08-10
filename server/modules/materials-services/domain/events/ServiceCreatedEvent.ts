
import { BaseDomainEvent } from '../../../shared/domain/events/BaseDomainEvent';

export interface ServiceCreatedEventData {
  serviceId: string;
  name: string;
  type: string;
  createdBy: string;
  tenantId: string;
  createdAt: Date;
}

export class ServiceCreatedEvent extends BaseDomainEvent<ServiceCreatedEventData> {
  constructor(data: ServiceCreatedEventData) {
    super('ServiceCreated', data);
  }
}
