// Domain Events for Ticket Module
import { IDomainEvent } from "../../../shared/events/IDomainEventPublisher";

export abstract class DomainEvent implements IDomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string
  ) {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  abstract get eventName(): string;
}

export class TicketCreated extends DomainEvent {
  get eventName(): string {
    return 'ticket.created''[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly ticketData: {
      number: string;
      subject: string;
      priority: string;
      caller?: { id: string; type: 'user' | 'customer'; name: string };
      beneficiary?: { id: string; type: 'user' | 'customer'; name: string };
      serviceType: 'auto' | 'proxy' | 'internal' | 'hybrid''[,;]
    }
  ) {
    super(aggregateId, tenantId);
  }
}

export class TicketAssigned extends DomainEvent {
  get eventName(): string {
    return 'ticket.assigned''[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly assignmentData: {
      number: string;
      assignedToId: string;
      assignedToName: string;
      assignmentGroup?: string;
      previousAssignee?: string;
    }
  ) {
    super(aggregateId, tenantId);
  }
}

export class TicketResolved extends DomainEvent {
  get eventName(): string {
    return 'ticket.resolved''[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly resolutionData: {
      number: string;
      resolutionCode: string;
      resolutionNotes?: string;
      resolvedBy: string;
      resolutionTimeHours: number;
    }
  ) {
    super(aggregateId, tenantId);
  }
}

export class TicketEscalated extends DomainEvent {
  get eventName(): string {
    return 'ticket.escalated''[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly escalationData: {
      number: string;
      fromPriority: string;
      toPriority: string;
      reason: string;
      escalatedBy?: string;
    }
  ) {
    super(aggregateId, tenantId);
  }
}