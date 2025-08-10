
import { BaseDomainEvent } from '../../../shared/domain/events/BaseDomainEvent';

export interface AuditLogCreatedEventData {
  auditId: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  tenantId: string;
  createdAt: Date;
}

export class AuditLogCreatedEvent extends BaseDomainEvent<AuditLogCreatedEventData> {
  constructor(data: AuditLogCreatedEventData) {
    super('AuditLogCreated', data);
  }
}
