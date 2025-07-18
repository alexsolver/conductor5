// Domain Entity - Pure business logic
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export class Ticket {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly subject: string,
    public readonly description: string | null = null,
    public readonly status: TicketStatus = 'open',
    public readonly priority: TicketPriority = 'medium',
    public readonly assignedToId: string | null = null,
    public readonly tags: string[] = [],
    public readonly metadata: Record<string, unknown> = {},
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Business rules
  get isOpen(): boolean {
    return this.status === 'open';
  }

  get isResolved(): boolean {
    return this.status === 'resolved' || this.status === 'closed';
  }

  get isAssigned(): boolean {
    return this.assignedToId !== null;
  }

  get isUrgent(): boolean {
    return this.priority === 'urgent' || this.priority === 'high';
  }

  get ageInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  canBeAssignedTo(userId: string): boolean {
    // Business rule: tickets can only be reassigned if not closed
    return this.status !== 'closed';
  }

  canBeResolvedBy(userId: string): boolean {
    // Business rule: only assigned agent or admin can resolve
    return this.assignedToId === userId || this.status !== 'closed';
  }

  // Factory methods
  static create(props: {
    tenantId: string;
    customerId: string;
    subject: string;
    description?: string;
    priority?: TicketPriority;
    assignedToId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Ticket {
    // Business validation
    if (!props.subject || props.subject.trim().length === 0) {
      throw new Error('Ticket subject is required');
    }

    if (props.subject.length > 500) {
      throw new Error('Ticket subject cannot exceed 500 characters');
    }

    if (!props.tenantId) {
      throw new Error('Ticket must belong to a tenant');
    }

    if (!props.customerId) {
      throw new Error('Ticket must have a customer');
    }

    return new Ticket(
      crypto.randomUUID(),
      props.tenantId,
      props.customerId,
      props.subject.trim(),
      props.description?.trim() || null,
      'open',
      props.priority || 'medium',
      props.assignedToId || null,
      props.tags || [],
      props.metadata || {},
      new Date(),
      new Date()
    );
  }

  assign(userId: string): Ticket {
    if (!this.canBeAssignedTo(userId)) {
      throw new Error('Cannot assign closed ticket');
    }

    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.subject,
      this.description,
      this.status === 'open' ? 'in_progress' : this.status,
      this.priority,
      userId,
      this.tags,
      this.metadata,
      this.createdAt,
      new Date()
    );
  }

  updateStatus(newStatus: TicketStatus): Ticket {
    // Business rules for status transitions
    if (this.status === 'closed' && newStatus !== 'closed') {
      throw new Error('Cannot reopen closed ticket');
    }

    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.subject,
      this.description,
      newStatus,
      this.priority,
      this.assignedToId,
      this.tags,
      this.metadata,
      this.createdAt,
      new Date()
    );
  }

  updatePriority(newPriority: TicketPriority): Ticket {
    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.subject,
      this.description,
      this.status,
      newPriority,
      this.assignedToId,
      this.tags,
      this.metadata,
      this.createdAt,
      new Date()
    );
  }
}