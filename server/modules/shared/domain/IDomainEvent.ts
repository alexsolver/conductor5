/**
 * Domain Event Interface
 * Clean Architecture - Shared Domain Layer
 * Base interface for all domain events
 */

export interface IDomainEvent {
  getAggregateId(): string;
  getEventType(): string;
  occurredOn: Date;
}