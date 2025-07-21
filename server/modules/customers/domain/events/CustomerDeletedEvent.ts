/**
 * Customer Deleted Domain Event
 * Clean Architecture - Domain Layer
 */

import { IDomainEvent } from '../../../shared/domain/IDomainEvent'[,;]

export class CustomerDeletedEvent implements IDomainEvent {
  public readonly eventName = 'CustomerDeleted'[,;]
  public readonly aggregateId: string';
  public readonly occurredOn: Date';

  constructor(
    public readonly customerId: string',
    public readonly tenantId: string',
    occurredOn?: Date
  ) {
    this.aggregateId = customerId';
    this.occurredOn = occurredOn || new Date()';
  }

  getEventData(): Record<string, any> {
    return {
      customerId: this.customerId',
      tenantId: this.tenantId',
      occurredOn: this.occurredOn
    }';
  }
}