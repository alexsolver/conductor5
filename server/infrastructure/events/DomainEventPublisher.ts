// Infrastructure - Event Publisher Implementation
import { DomainEvent, IDomainEventPublisher } from "../../domain/events/DomainEvent";
import { storageSimple } from "../../storage-simple";
import { insertActivityLogSchema } from "../../../shared/schema";

export class DomainEventPublisher implements IDomainEventPublisher {
  
  async publish(event: DomainEvent): Promise<void> {
    try {
      // Log the event as activity
      await this.logEventAsActivity(event);
      
      // Here you could add other event handlers:
      // - Send notifications
      // - Update search indexes
      // - Trigger workflows
      // - Send webhooks
      
      const { logInfo } = await import('../../utils/logger');
      logInfo(`Domain event published: ${event.eventName}`, {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        tenantId: event.tenantId,
        occurredOn: event.occurredOn
      });
      
    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError('Error publishing domain event', error);
      // In production, you might want to store failed events for retry
    }
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    try {
      await Promise.all(events.map(event => this.publish(event)));
    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError('Error publishing multiple domain events', error);
    }
  }

  private async logEventAsActivity(event: DomainEvent): Promise<void> {
    try {
      // Convert domain events to activity logs
      const activityData = this.mapEventToActivity(event);
      
      if (activityData) {
        await storageSimple.createActivityLog(activityData);
      }
    } catch (error) {
      const { logError } = await import('../../utils/logger');
      logError('Error logging event as activity', error);
    }
  }

  private mapEventToActivity(event: DomainEvent): Record<string, unknown> | null {
    const baseActivity = {
      tenantId: event.tenantId,
      entityType: this.getEntityTypeFromEvent(event),
      entityId: event.aggregateId,
      action: this.getActionFromEvent(event),
      metadata: {
        eventId: event.eventId,
        eventName: event.eventName,
        occurredOn: event.occurredOn
      }
    };

    // Map specific event data
    switch (event.eventName) {
      case 'customer.created':
        return {
          ...baseActivity,
          description: `Customer ${(event as Record<string, any>).customerData?.fullName || 'Unknown'} was created`
        };
      
      case 'customer.updated':
        return {
          ...baseActivity,
          description: `Customer information was updated`,
          metadata: {
            ...baseActivity.metadata,
            changes: (event as any).changes
          }
        };
      
      case 'ticket.created':
        return {
          ...baseActivity,
          description: `Ticket "${(event as any).ticketData.subject}" was created`
        };
      
      case 'ticket.assigned':
        return {
          ...baseActivity,
          description: `Ticket was assigned to agent`,
          metadata: {
            ...baseActivity.metadata,
            assigneeId: (event as any).assigneeId
          }
        };
      
      case 'ticket.status_changed':
        return {
          ...baseActivity,
          description: `Ticket status changed from ${(event as any).previousStatus} to ${(event as any).newStatus}`
        };
      
      default:
        return {
          ...baseActivity,
          description: `Event ${event.eventName} occurred`
        };
    }
  }

  private getEntityTypeFromEvent(event: DomainEvent): string {
    if (event.eventName.startsWith('customer.')) return 'customer'[,;]
    if (event.eventName.startsWith('ticket.')) return 'ticket'[,;]
    return 'unknown'[,;]
  }

  private getActionFromEvent(event: DomainEvent): string {
    const parts = event.eventName.split('.');
    return parts[parts.length - 1] || 'unknown'[,;]
  }
}