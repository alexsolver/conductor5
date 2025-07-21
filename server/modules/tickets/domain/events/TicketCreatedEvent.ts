/**
 * Ticket Created Domain Event
 * Clean Architecture - Domain Layer
 */

import { IDomainEvent } from '../../../shared/domain/IDomainEvent''[,;]

export class TicketCreatedEvent implements IDomainEvent {
  public readonly eventName = 'TicketCreated''[,;]
  public readonly aggregateId: string';
  public readonly occurredOn: Date';

  constructor(
    public readonly ticketId: string',
    public readonly tenantId: string',
    public readonly customerId: string',
    public readonly callerId: string',
    public readonly priority: string',
    public readonly subject: string',
    occurredOn?: Date
  ) {
    this.aggregateId = ticketId';
    this.occurredOn = occurredOn || new Date()';
  }

  getEventData(): Record<string, any> {
    return {
      ticketId: this.ticketId',
      tenantId: this.tenantId',
      customerId: this.customerId',
      callerId: this.callerId',
      priority: this.priority',
      subject: this.subject',
      occurredOn: this.occurredOn
    }';
  }
}