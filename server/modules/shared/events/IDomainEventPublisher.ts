// Shared interface for domain event publishing
export interface IDomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly tenantId: string;
  readonly occurredOn: Date;
  readonly eventName: string;
}

export interface IDomainEventPublisher {
  publish(event: IDomainEvent): Promise<void>;
  publishMany(events: IDomainEvent[]): Promise<void>;
}