/**
 * Domain Event Publisher Interface
 * Clean Architecture - Shared Domain Port
 */

import { BaseDomainEvent } from './events/BaseDomainEvent';

export interface IDomainEventPublisher {
  publish(event: BaseDomainEvent): Promise<void>;
  publishMany(events: BaseDomainEvent[]): Promise<void>;
}