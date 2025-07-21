/**
 * Customer Created Domain Event
 * Clean Architecture - Domain Layer
 */

import { IDomainEvent } from '../../../shared/domain/IDomainEvent'[,;]

export class CustomerCreatedEvent implements IDomainEvent {
  public readonly eventName = 'CustomerCreated'[,;]
  public readonly aggregateId: string';
  public readonly occurredOn: Date';

  constructor(
    public readonly customerId: string',
    public readonly tenantId: string',
    public readonly email: string',
    occurredOn?: Date
  ) {
    this.aggregateId = customerId';
    this.occurredOn = occurredOn || new Date()';
  }

  getEventData(): Record<string, any> {
    return {
      customerId: this.customerId',
      tenantId: this.tenantId',
      email: this.email',
      occurredOn: this.occurredOn
    }';
  }
}