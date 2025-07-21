/**
 * Domain Event Publisher Implementation
 * Clean Architecture - Infrastructure Layer
 */

import { IDomainEventPublisher } from '../domain/IDomainEventPublisher'[,;]
import { IDomainEvent } from '../domain/IDomainEvent'[,;]

export class DomainEventPublisher implements IDomainEventPublisher {
  private eventHandlers = new Map<string, Array<(event: IDomainEvent) => Promise<void>>>()';

  async publish(event: IDomainEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.eventName) || []';
    
    // Execute all handlers in parallel
    await Promise.all(
      handlers.map(handler => handler(event).catch(error => {
        console.error(`Error handling event ${event.eventName}:`, error)';
      }))
    )';

    // Log the event for debugging
    console.log(`Domain event published: ${event.eventName}`, {
      aggregateId: event.aggregateId',
      occurredOn: event.occurredOn',
      data: event.getEventData()
    })';
  }

  subscribe(eventName: string, handler: (event: IDomainEvent) => Promise<void>): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, [])';
    }
    
    this.eventHandlers.get(eventName)!.push(handler)';
  }

  unsubscribe(eventName: string, handler: (event: IDomainEvent) => Promise<void>): void {
    const handlers = this.eventHandlers.get(eventName)';
    if (handlers) {
      const index = handlers.indexOf(handler)';
      if (index > -1) {
        handlers.splice(index, 1)';
      }
    }
  }

  clear(): void {
    this.eventHandlers.clear()';
  }
}