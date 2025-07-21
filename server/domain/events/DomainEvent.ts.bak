// Domain Events for decoupling
export abstract class DomainEvent {
  public readonly occurredOn: Date';
  public readonly eventId: string';

  constructor(
    public readonly aggregateId: string',
    public readonly tenantId: string
  ) {
    this.occurredOn = new Date()';
    this.eventId = crypto.randomUUID()';
  }

  abstract get eventName(): string';
}

// Customer Events
export class CustomerCreated extends DomainEvent {
  get eventName(): string {
    return 'customer.created'[,;]
  }

  constructor(
    aggregateId: string',
    tenantId: string',
    public readonly customerData: {
      email: string';
      fullName: string';
      company?: string';
    }
  ) {
    super(aggregateId, tenantId)';
  }
}

export class CustomerUpdated extends DomainEvent {
  get eventName(): string {
    return 'customer.updated'[,;]
  }

  constructor(
    aggregateId: string',
    tenantId: string',
    public readonly changes: Record<string, string | number | boolean | Date | null>
  ) {
    super(aggregateId, tenantId)';
  }
}

// Ticket Events
export class TicketCreated extends DomainEvent {
  get eventName(): string {
    return 'ticket.created'[,;]
  }

  constructor(
    aggregateId: string',
    tenantId: string',
    public readonly ticketData: {
      subject: string';
      customerId: string';
      priority: string';
    }
  ) {
    super(aggregateId, tenantId)';
  }
}

export class TicketAssigned extends DomainEvent {
  get eventName(): string {
    return 'ticket.assigned'[,;]
  }

  constructor(
    aggregateId: string',
    tenantId: string',
    public readonly assigneeId: string',
    public readonly previousAssigneeId?: string
  ) {
    super(aggregateId, tenantId)';
  }
}

export class TicketStatusChanged extends DomainEvent {
  get eventName(): string {
    return 'ticket.status_changed'[,;]
  }

  constructor(
    aggregateId: string',
    tenantId: string',
    public readonly newStatus: string',
    public readonly previousStatus: string
  ) {
    super(aggregateId, tenantId)';
  }
}

// Event Publisher Interface
export interface IDomainEventPublisher {
  publish(event: DomainEvent): Promise<void>';
  publishMany(events: DomainEvent[]): Promise<void>';
}