// Domain Entity - Pure business logic
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketState = 'new' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
export type TicketImpact = 'low' | 'medium' | 'high';
export type TicketUrgency = 'low' | 'medium' | 'high';

export type PersonType = 'user' | 'customer';

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
    public readonly metadata: Record<string, any> = {},
    // ServiceNow-style professional fields
    public readonly number: string | null = null,
    public readonly shortDescription: string | null = null,
    public readonly category: string | null = null,
    public readonly subcategory: string | null = null,
    public readonly impact: TicketImpact = 'medium',
    public readonly urgency: TicketUrgency = 'medium',
    public readonly state: TicketState = 'new',
    // Enhanced person referencing - Flexible caller and beneficiary
    public readonly callerId: string,
    public readonly callerType: PersonType = 'customer',
    public readonly beneficiaryId: string | null = null,
    public readonly beneficiaryType: PersonType = 'customer',
    public readonly openedById: string | null = null,
    public readonly assignmentGroup: string | null = null,
    public readonly location: string | null = null,
    public readonly openedAt: Date | null = null,
    public readonly resolvedAt: Date | null = null,
    public readonly closedAt: Date | null = null,
    public readonly resolutionCode: string | null = null,
    public readonly resolutionNotes: string | null = null,
    public readonly workNotes: string | null = null,
    public readonly configurationItem: string | null = null,
    public readonly businessService: string | null = null,
    public readonly contactType: string = 'email',
    public readonly notify: boolean = true,
    public readonly closeNotes: string | null = null,
    public readonly businessImpact: string | null = null,
    public readonly symptoms: string | null = null,
    public readonly rootCause: string | null = null,
    public readonly workaround: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    // Auto-assign beneficiary if not provided
    if (!this.beneficiaryId) {
      (this as any).beneficiaryId = this.callerId;
      (this as any).beneficiaryType = this.callerType;
    }
  }

  // Business rules
  get isOpen(): boolean {
    return this.status === 'open' || this.state === 'new';
  }

  get isResolved(): boolean {
    return this.status === 'resolved' || this.state === 'resolved';
  }

  get isClosed(): boolean {
    return this.status === 'closed' || this.state === 'closed';
  }

  get isAssigned(): boolean {
    return this.assignedToId !== null;
  }

  get isAutoService(): boolean {
    return this.callerId === this.beneficiaryId && this.callerType === this.beneficiaryType;
  }

  get isProxyService(): boolean {
    return this.callerId !== this.beneficiaryId || this.callerType !== this.beneficiaryType;
  }

  get isInternalService(): boolean {
    return this.callerType === 'user' && this.beneficiaryType === 'user';
  }

  get isCustomerService(): boolean {
    return this.callerType === 'customer' || this.beneficiaryType === 'customer';
  }

  get isHybridService(): boolean {
    return this.callerType !== this.beneficiaryType;
  }

  get isUrgent(): boolean {
    return this.priority === 'critical' || this.urgency === 'high';
  }

  get isHighImpact(): boolean {
    return this.impact === 'high';
  }

  get ageInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get ageInHours(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  get resolutionTimeInHours(): number | null {
    if (!this.resolvedAt) return null;
    const diffTime = Math.abs(this.resolvedAt.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  get calculatedPriority(): TicketPriority {
    // ServiceNow-style priority calculation based on impact and urgency
    if (this.impact === 'high' && this.urgency === 'high') return 'critical';
    if (this.impact === 'high' || this.urgency === 'high') return 'high';
    if (this.impact === 'medium' && this.urgency === 'medium') return 'medium';
    return 'low';
  }

  canBeAssignedTo(userId: string): boolean {
    return !this.isClosed;
  }

  canBeResolvedBy(userId: string): boolean {
    return this.isAssigned && (this.assignedToId === userId || !this.isClosed);
  }

  // Validation methods for person references
  validateReferences(): void {
    if (!this.callerId) {
      throw new Error('Caller is required');
    }
    
    if (!this.beneficiaryId) {
      throw new Error('Beneficiary must be set (defaults to caller)');
    }
    
    // Business rule: caller and beneficiary must belong to same tenant
    // (This validation should be implemented in repository layer)
  }

  // Helper methods for person identification
  getCallerReference(): { id: string; type: PersonType } {
    return { id: this.callerId, type: this.callerType };
  }

  getBeneficiaryReference(): { id: string; type: PersonType } {
    return { id: this.beneficiaryId!, type: this.beneficiaryType };
  }

  canBeReopened(): boolean {
    return this.isResolved || this.isClosed;
  }

  canBeClosed(): boolean {
    return this.isResolved;
  }

  shouldEscalate(): boolean {
    // Business rule: escalate high priority tickets older than 4 hours
    return this.isUrgent && this.ageInHours > 4 && !this.isAssigned;
  }

  isBreachingSLA(): boolean {
    // Business rule: SLA breach based on priority
    const slaHours = this.getSLAHours();
    return this.ageInHours > slaHours && this.isOpen;
  }

  private getSLAHours(): number {
    switch (this.priority) {
      case 'critical': return 2;
      case 'high': return 8;
      case 'medium': return 24;
      case 'low': return 72;
      default: return 24;
    }
  }

  // Factory methods
  static create(props: {
    tenantId: string;
    customerId: string;
    subject: string;
    description?: string;
    shortDescription?: string;
    category?: string;
    subcategory?: string;
    priority?: TicketPriority;
    impact?: TicketImpact;
    urgency?: TicketUrgency;
    assignedToId?: string;
    // Enhanced person referencing
    callerId: string;
    callerType?: PersonType;
    beneficiaryId?: string;
    beneficiaryType?: PersonType;
    openedById?: string;
    assignmentGroup?: string;
    location?: string;
    contactType?: string;
    businessImpact?: string;
    symptoms?: string;
    workaround?: string;
    tags?: string[];
    metadata?: Record<string, any>;
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
      throw new Error('Ticket must be associated with a customer');
    }

    if (!props.callerId) {
      throw new Error('Caller is required');
    }

    // Generate ticket number
    const ticketNumber = `INC${Date.now().toString().slice(-8)}`;

    // Default values for person referencing
    const callerType = props.callerType || 'customer';
    const beneficiaryId = props.beneficiaryId || props.callerId;
    const beneficiaryType = props.beneficiaryType || callerType;

    return new Ticket(
      crypto.randomUUID(),
      props.tenantId,
      props.customerId,
      props.subject,
      props.description || null,
      'open',
      props.priority || 'medium',
      props.assignedToId || null,
      props.tags || [],
      props.metadata || {},
      ticketNumber,
      props.shortDescription || props.subject,
      props.category || null,
      props.subcategory || null,
      props.impact || 'medium',
      props.urgency || 'medium',
      'new',
      props.callerId,
      callerType,
      beneficiaryId,
      beneficiaryType,
      props.openedById || null,
      props.assignmentGroup || null,
      props.location || null,
      new Date(), // openedAt
      null, // resolvedAt
      null, // closedAt
      null, // resolutionCode
      null, // resolutionNotes
      null, // workNotes
      null, // configurationItem
      null, // businessService
      props.contactType || 'email',
      true, // notify
      null, // closeNotes
      props.businessImpact || null,
      props.symptoms || null,
      null, // rootCause
      props.workaround || null,
      new Date(),
      new Date()
    );
  }

  // State transition methods (immutable)
  assign(userId: string, assignmentGroup?: string): Ticket {
    if (!this.canBeAssignedTo(userId)) {
      throw new Error('Ticket cannot be assigned');
    }

    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.subject,
      this.description,
      'in_progress',
      this.priority,
      userId,
      this.tags,
      this.metadata,
      this.number,
      this.shortDescription,
      this.category,
      this.subcategory,
      this.impact,
      this.urgency,
      'in_progress',
      this.callerId,
      this.openedById,
      assignmentGroup || this.assignmentGroup,
      this.location,
      this.openedAt,
      this.resolvedAt,
      this.closedAt,
      this.resolutionCode,
      this.resolutionNotes,
      this.workNotes,
      this.configurationItem,
      this.businessService,
      this.contactType,
      this.notify,
      this.closeNotes,
      this.businessImpact,
      this.symptoms,
      this.rootCause,
      this.workaround,
      this.createdAt,
      new Date()
    );
  }

  resolve(resolutionCode: string, resolutionNotes: string): Ticket {
    if (!this.canBeResolvedBy(this.assignedToId || '')) {
      throw new Error('Ticket cannot be resolved');
    }

    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.subject,
      this.description,
      'resolved',
      this.priority,
      this.assignedToId,
      this.tags,
      this.metadata,
      this.number,
      this.shortDescription,
      this.category,
      this.subcategory,
      this.impact,
      this.urgency,
      'resolved',
      this.callerId,
      this.openedById,
      this.assignmentGroup,
      this.location,
      this.openedAt,
      new Date(), // resolvedAt
      this.closedAt,
      resolutionCode,
      resolutionNotes,
      this.workNotes,
      this.configurationItem,
      this.businessService,
      this.contactType,
      this.notify,
      this.closeNotes,
      this.businessImpact,
      this.symptoms,
      this.rootCause,
      this.workaround,
      this.createdAt,
      new Date()
    );
  }

  close(closeNotes?: string): Ticket {
    if (!this.canBeClosed()) {
      throw new Error('Ticket must be resolved before closing');
    }

    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.subject,
      this.description,
      'closed',
      this.priority,
      this.assignedToId,
      this.tags,
      this.metadata,
      this.number,
      this.shortDescription,
      this.category,
      this.subcategory,
      this.impact,
      this.urgency,
      'closed',
      this.callerId,
      this.openedById,
      this.assignmentGroup,
      this.location,
      this.openedAt,
      this.resolvedAt,
      new Date(), // closedAt
      this.resolutionCode,
      this.resolutionNotes,
      this.workNotes,
      this.configurationItem,
      this.businessService,
      this.contactType,
      this.notify,
      closeNotes || this.closeNotes,
      this.businessImpact,
      this.symptoms,
      this.rootCause,
      this.workaround,
      this.createdAt,
      new Date()
    );
  }

  escalate(newPriority: TicketPriority, escalationReason: string): Ticket {
    const escalationMetadata = {
      ...this.metadata,
      escalations: [
        ...(this.metadata.escalations || []),
        {
          fromPriority: this.priority,
          toPriority: newPriority,
          reason: escalationReason,
          escalatedAt: new Date(),
        }
      ]
    };

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
      escalationMetadata,
      this.number,
      this.shortDescription,
      this.category,
      this.subcategory,
      this.impact,
      this.urgency,
      this.state,
      this.callerId,
      this.openedById,
      this.assignmentGroup,
      this.location,
      this.openedAt,
      this.resolvedAt,
      this.closedAt,
      this.resolutionCode,
      this.resolutionNotes,
      this.workNotes,
      this.configurationItem,
      this.businessService,
      this.contactType,
      this.notify,
      this.closeNotes,
      this.businessImpact,
      this.symptoms,
      this.rootCause,
      this.workaround,
      this.createdAt,
      new Date()
    );
  }
}