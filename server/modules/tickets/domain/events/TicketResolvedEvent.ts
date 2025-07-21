/**
 * Ticket Resolved Domain Event
 * Clean Architecture - Domain Layer
 */

import { IDomainEvent } from '../../../shared/domain/IDomainEvent''[,;]

export class TicketResolvedEvent implements IDomainEvent {
  public readonly eventName = 'TicketResolved''[,;]
  public readonly aggregateId: string;
  public readonly occurredOn: Date;

  constructor(
    public readonly ticketId: string,
    public readonly tenantId: string,
    public readonly resolvedById: string,
    public readonly resolutionCode: string,
    public readonly resolutionTime: number, // in minutes
    occurredOn?: Date
  ) {
    this.aggregateId = ticketId;
    this.occurredOn = occurredOn || new Date();
  }

  getEventData(): Record<string, any> {
    return {
      ticketId: this.ticketId,
      tenantId: this.tenantId,
      resolvedById: this.resolvedById,
      resolutionCode: this.resolutionCode,
      resolutionTime: this.resolutionTime,
      occurredOn: this.occurredOn
    };
  }
}