/**
 * Ticket Assigned Domain Event
 * Clean Architecture - Domain Layer
 */

import { IDomainEvent } from '../../../shared/domain/IDomainEvent';

export class TicketAssignedEvent implements IDomainEvent {
  public readonly eventName = 'TicketAssigned';
  public readonly aggregateId: string;
  public readonly occurredOn: Date;

  constructor(
    public readonly ticketId: string,
    public readonly tenantId: string,
    public readonly assignedToId: string,
    public readonly assignedById: string,
    public readonly priority: string,
    occurredOn?: Date
  ) {
    this.aggregateId = ticketId;
    this.occurredOn = occurredOn || new Date();
  }

  getEventData(): Record<string, any> {
    return {
      ticketId: this.ticketId,
      tenantId: this.tenantId,
      assignedToId: this.assignedToId,
      assignedById: this.assignedById,
      priority: this.priority,
      occurredOn: this.occurredOn
    };
  }
}