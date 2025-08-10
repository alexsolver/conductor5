/**
 * Ticket Domain Entity
 * Clean Architecture - Domain Layer
 * Contains business rules and invariants for tickets
 */

import { TicketStatus, TicketPriority } from '../value-objects';

export class Ticket {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private customerId: string,
    private readonly callerId: string,
    private readonly callerType: 'user' | 'customer',
    private subject: string,
    private description: string,
    private readonly number: string,
    private shortDescription: string,
    private category: string,
    private subcategory: string,
    private priority: TicketPriority,
    private impact: 'low' | 'medium' | 'high' | 'critical',
    private urgency: 'low' | 'medium' | 'high',
    private state: TicketStatus,
    private status: string,
    private assignedToId: string | null,
    private beneficiaryId: string | null,
    private beneficiaryType: 'user' | 'customer' | null,
    private assignmentGroup: string | null,
    private location: string | null,
    private contactType: string,
    private businessImpact: string | null,
    private symptoms: string | null,
    private workaround: string | null,
    private configurationItem: string | null,
    private businessService: string | null,
    private resolutionCode: string | null,
    private resolutionNotes: string | null,
    private workNotes: string | null,
    private closeNotes: string | null,
    private notify: boolean,
    private rootCause: string | null,
    private readonly openedAt: Date,
    private resolvedAt: Date | null,
    private closedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getCustomerId(): string { return this.customerId; }
  getCallerId(): string { return this.callerId; }
  getCallerType(): 'user' | 'customer' { return this.callerType; }
  getSubject(): string { return this.subject; }
  getDescription(): string { return this.description; }
  getNumber(): string { return this.number; }
  getShortDescription(): string { return this.shortDescription; }
  getCategory(): string { return this.category; }
  getSubcategory(): string { return this.subcategory; }
  getPriority(): TicketPriority { return this.priority; }
  getImpact(): 'low' | 'medium' | 'high' | 'critical' { return this.impact; }
  getUrgency(): 'low' | 'medium' | 'high' { return this.urgency; }
  getState(): TicketStatus { return this.state; }
  getStatus(): string { return this.status; }
  getAssignedToId(): string | null { return this.assignedToId; }
  getBeneficiaryId(): string | null { return this.beneficiaryId; }
  getBeneficiaryType(): 'user' | 'customer' | null { return this.beneficiaryType; }
  getOpenedAt(): Date { return this.openedAt; }
  getResolvedAt(): Date | null { return this.resolvedAt; }
  getClosedAt(): Date | null { return this.closedAt; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business rules
  canBeAssigned(): boolean {
    return this.state.getValue() !== 'closed' && this.state.getValue() !== 'resolved';
  }

  canBeResolved(): boolean {
    return this.state.getValue() === 'in_progress' || this.state.getValue() === 'open';
  }

  canBeClosed(): boolean {
    return this.state.getValue() === 'resolved' || this.state.getValue() === 'in_progress';
  }

  isOverdue(): boolean {
    if (this.state.getValue() === 'closed' || this.state.getValue() === 'resolved') {
      return false;
    }

    // Business rule: High priority tickets are overdue after 4 hours
    // Medium priority after 24 hours, Low priority after 72 hours
    const hoursLimit = {
      urgent: 2,
      high: 4,
      medium: 24,
      low: 72
    }[this.priority.getValue()];

    const hoursSinceCreated = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated > hoursLimit;
  }

  requiresEscalation(): boolean {
    return this.priority.getValue() === 'urgent' && !this.assignedToId;
  }

  // Factory method
  static create(props: TicketCreateProps, ticketNumber: string, idGenerator: { generate(): string }): Ticket {
    // Business validation
    if (!props.subject?.trim()) {
      throw new Error('Ticket subject is required');
    }

    if (!props.description?.trim()) {
      throw new Error('Ticket description is required');
    }

    if (!props.tenantId) {
      throw new Error('Ticket must belong to a tenant');
    }

    if (!props.customerId) {
      throw new Error('Ticket must have a customer');
    }

    if (!props.callerId) {
      throw new Error('Ticket must have a caller');
    }

    const now = new Date();

    return new Ticket(
      idGenerator.generate(),
      props.tenantId,
      props.customerId,
      props.callerId,
      props.callerType,
      props.subject.trim(),
      props.description.trim(),
      ticketNumber,
      props.shortDescription?.trim() || props.subject.trim(),
      props.category || 'general',
      props.subcategory || '',
      new TicketPriority(props.priority || 'medium'),
      props.impact || 'medium',
      props.urgency || 'medium',
      new TicketStatus(props.state || 'open'),
      props.status || 'open',
      props.assignedToId || null,
      props.beneficiaryId || null,
      props.beneficiaryType || null,
      props.assignmentGroup || null,
      props.location || null,
      props.contactType || 'email',
      props.businessImpact || null,
      props.symptoms || null,
      props.workaround || null,
      props.configurationItem || null,
      props.businessService || null,
      props.resolutionCode || null,
      props.resolutionNotes || null,
      props.workNotes || null,
      props.closeNotes || null,
      props.notify || true,
      props.rootCause || null,
      now, // openedAt
      null, // resolvedAt
      null, // closedAt
      now, // createdAt
      now  // updatedAt
    );
  }

  // Update methods (immutable)
  assign(assignedToId: string, assignmentGroup?: string): Ticket {
    if (!this.canBeAssigned()) {
      throw new Error('Ticket cannot be assigned in current state');
    }

    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.callerId,
      this.callerType,
      this.subject,
      this.description,
      this.number,
      this.shortDescription,
      this.category,
      this.subcategory,
      new TicketPriority(this.priority.getValue()), // Preserve existing priority
      this.impact,
      this.urgency,
      new TicketStatus('in_progress'), // Change state to in_progress when assigned
      this.status,
      assignedToId,
      this.beneficiaryId,
      this.beneficiaryType,
      assignmentGroup || this.assignmentGroup,
      this.location,
      this.contactType,
      this.businessImpact,
      this.symptoms,
      this.workaround,
      this.configurationItem,
      this.businessService,
      this.resolutionCode,
      this.resolutionNotes,
      this.workNotes,
      this.closeNotes,
      this.notify,
      this.rootCause,
      this.openedAt,
      this.resolvedAt,
      this.closedAt,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  resolve(resolutionCode: string, resolutionNotes: string): Ticket {
    if (!this.canBeResolved()) {
      throw new Error('Ticket cannot be resolved in current state');
    }

    const now = new Date();

    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.callerId,
      this.callerType,
      this.subject,
      this.description,
      this.number,
      this.shortDescription,
      this.category,
      this.subcategory,
      this.priority, // Preserve existing priority
      this.impact,
      this.urgency,
      new TicketStatus('resolved'),
      'resolved',
      this.assignedToId,
      this.beneficiaryId,
      this.beneficiaryType,
      this.assignmentGroup,
      this.location,
      this.contactType,
      this.businessImpact,
      this.symptoms,
      this.workaround,
      this.configurationItem,
      this.businessService,
      resolutionCode,
      resolutionNotes,
      this.workNotes,
      this.closeNotes,
      this.notify,
      this.rootCause,
      this.openedAt,
      now, // resolvedAt
      this.closedAt,
      this.createdAt,
      now // updatedAt
    );
  }

  close(closeNotes?: string): Ticket {
    if (!this.canBeClosed()) {
      throw new Error('Ticket cannot be closed in current state');
    }

    const now = new Date();

    return new Ticket(
      this.id,
      this.tenantId,
      this.customerId,
      this.callerId,
      this.callerType,
      this.subject,
      this.description,
      this.number,
      this.shortDescription,
      this.category,
      this.subcategory,
      this.priority, // Preserve existing priority
      this.impact,
      this.urgency,
      new TicketStatus('closed'),
      'closed',
      this.assignedToId,
      this.beneficiaryId,
      this.beneficiaryType,
      this.assignmentGroup,
      this.location,
      this.contactType,
      this.businessImpact,
      this.symptoms,
      this.workaround,
      this.configurationItem,
      this.businessService,
      this.resolutionCode,
      this.resolutionNotes,
      this.workNotes,
      closeNotes || this.closeNotes,
      this.notify,
      this.rootCause,
      this.openedAt,
      this.resolvedAt,
      now, // closedAt
      this.createdAt,
      now // updatedAt
    );
  }

  // Factory method for reconstruction from persistence
  static fromPersistence(data: any): Ticket {
    return new Ticket(
      data.id,
      data.tenantId,
      data.customerId,
      data.callerId,
      data.callerType,
      data.subject,
      data.description,
      data.number,
      data.shortDescription,
      data.category,
      data.subcategory,
      new TicketPriority(data.priority), // Use value object
      data.impact,
      data.urgency,
      new TicketStatus(data.state), // Use value object
      data.status,
      data.assignedToId,
      data.beneficiaryId,
      data.beneficiaryType,
      data.assignmentGroup,
      data.location,
      data.contactType,
      data.businessImpact,
      data.symptoms,
      data.workaround,
      data.configurationItem,
      data.businessService,
      data.resolutionCode,
      data.resolutionNotes,
      data.workNotes,
      data.closeNotes,
      data.notify,
      data.rootCause,
      data.openedAt,
      data.resolvedAt,
      data.closedAt,
      data.createdAt,
      data.updatedAt
    );
  }
}