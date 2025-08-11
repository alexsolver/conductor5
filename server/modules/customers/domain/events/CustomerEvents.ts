/**
 * Customer Domain Events
 * Clean Architecture - Domain Layer
 * Defines customer-related domain events
 */

import { IDomainEvent } from '../../../shared/domain/IDomainEvent';
import { Customer } from '../entities/Customer';

export class CustomerCreated implements IDomainEvent {
  constructor(
    public readonly customer: Customer,
    public readonly occurredOn: Date = new Date()
  ) {}

  getAggregateId(): string {
    return this.customer.id;
  }

  getEventType(): string {
    return 'CustomerCreated';
  }
}

export class CustomerUpdated implements IDomainEvent {
  constructor(
    public readonly customer: Customer,
    public readonly changes: Record<string, any>,
    public readonly occurredOn: Date = new Date()
  ) {}

  getAggregateId(): string {
    return this.customer.id;
  }

  getEventType(): string {
    return 'CustomerUpdated';
  }
}

export class CustomerDeleted implements IDomainEvent {
  constructor(
    public readonly customerId: string,
    public readonly tenantId: string,
    public readonly occurredOn: Date = new Date()
  ) {}

  getAggregateId(): string {
    return this.customerId;
  }

  getEventType(): string {
    return 'CustomerDeleted';
  }
}