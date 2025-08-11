/**
 * Domain Event Publisher Interface
 * Clean Architecture - Shared Infrastructure Layer
 * Contract for publishing domain events
 */

import { IDomainEvent } from '../domain/IDomainEvent';

export interface IDomainEventPublisher {
  publish(event: IDomainEvent): Promise<void>;
  publishAll(events: IDomainEvent[]): Promise<void>;
}