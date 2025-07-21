// Domain Events for Customer Module
export abstract class DomainEvent {
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

export class CustomerCreated extends DomainEvent {
  get eventName(): string {
    return 'customer.created'[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly customerData: {
      email: string;
      fullName: string;
      company?: string;
    }
  ) {
    super(aggregateId, tenantId);
  }
}

export class CustomerUpdated extends DomainEvent {
  get eventName(): string {
    return 'customer.updated'[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly changes: Record<string, any>
  ) {
    super(aggregateId, tenantId);
  }
}

export class CustomerSuspended extends DomainEvent {
  get eventName(): string {
    return 'customer.suspended'[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly reason?: string
  ) {
    super(aggregateId, tenantId);
  }
}

export class CustomerActivated extends DomainEvent {
  get eventName(): string {
    return 'customer.activated'[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string
  ) {
    super(aggregateId, tenantId);
  }
}

export class CustomerVerified extends DomainEvent {
  get eventName(): string {
    return 'customer.verified'[,;]
  }

  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly verificationMethod: string
  ) {
    super(aggregateId, tenantId);
  }
}