// Shared infrastructure for domain event publishing
import { IDomainEvent, IDomainEventPublisher } from "../events/IDomainEventPublisher";

export class DomainEventPublisher implements IDomainEventPublisher {
  
  async publish(event: IDomainEvent): Promise<void> {
    try {
      // Log the event for debugging and audit
      console.log(`Domain event published: ${event.eventName}`, {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        tenantId: event.tenantId,
        occurredOn: event.occurredOn
      });
      
      // Here you could add other event handlers:
      // - Send notifications
      // - Update search indexes
      // - Trigger workflows
      // - Send webhooks
      // - Store in event store
      
    } catch (error) {
      console.error('Error publishing domain event:', error);
      // In production, you might want to store failed events for retry
    }
  }

  async publishMany(events: IDomainEvent[]): Promise<void> {
    try {
      await Promise.all(events.map(event => this.publish(event)));
    } catch (error) {
      console.error('Error publishing multiple domain events:', error);
    }
  }
}