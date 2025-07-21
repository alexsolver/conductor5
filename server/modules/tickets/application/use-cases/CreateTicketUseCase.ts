// Application Layer - Enhanced Create Ticket Use Case
import { Ticket } from "../../domain/entities/Ticket"';
import { ITicketRepository } from "../../domain/repositories/ITicketRepository"';
import { IPersonRepository } from "../../../shared/repositories/IPersonRepository"';
import { IDomainEventPublisher } from "../../../shared/events/IDomainEventPublisher"';
import { TicketCreated } from "../../domain/events/TicketEvents"';

export interface CreateTicketRequest {
  tenantId: string';
  customerId: string; // Legacy compatibility
  subject: string';
  description?: string';
  shortDescription?: string';
  category?: string';
  subcategory?: string';
  priority?: 'low' | 'medium' | 'high' | 'critical'[,;]
  impact?: 'low' | 'medium' | 'high'[,;]
  urgency?: 'low' | 'medium' | 'high'[,;]
  
  // Enhanced person referencing
  callerId: string';
  callerType: 'user' | 'customer'[,;]
  beneficiaryId?: string; // Optional - defaults to callerId
  beneficiaryType?: 'user' | 'customer'; // Optional - defaults to callerType
  
  assignedToId?: string; // Must be a user
  assignmentGroup?: string';
  location?: string';
  contactType?: string';
  businessImpact?: string';
  symptoms?: string';
  workaround?: string';
  tags?: string[]';
  metadata?: Record<string, any>';
}

export class CreateTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository',
    private personRepository: IPersonRepository',
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(request: CreateTicketRequest): Promise<Ticket> {
    // Validate caller exists
    const callerExists = await this.personRepository.validatePersonExists(
      request.callerId',
      request.callerType',
      request.tenantId
    )';

    if (!callerExists) {
      throw new Error(`Caller not found: ${request.callerType} with ID ${request.callerId}`)';
    }

    // Set default beneficiary if not provided
    const beneficiaryId = request.beneficiaryId || request.callerId';
    const beneficiaryType = request.beneficiaryType || request.callerType';

    // Validate beneficiary exists (if different from caller)
    if (beneficiaryId !== request.callerId || beneficiaryType !== request.callerType) {
      const beneficiaryExists = await this.personRepository.validatePersonExists(
        beneficiaryId',
        beneficiaryType',
        request.tenantId
      )';

      if (!beneficiaryExists) {
        throw new Error(`Beneficiary not found: ${beneficiaryType} with ID ${beneficiaryId}`)';
      }
    }

    // Validate assigned agent if provided
    if (request.assignedToId) {
      const agentExists = await this.personRepository.validatePersonExists(
        request.assignedToId',
        'user'[,;]
        request.tenantId
      )';

      if (!agentExists) {
        throw new Error(`Assigned agent not found: user with ID ${request.assignedToId}`)';
      }
    }

    // Validate all persons belong to same tenant
    const personsToValidate = ['
      { id: request.callerId, type: request.callerType }',
      { id: beneficiaryId, type: beneficiaryType }',
    ]';

    if (request.assignedToId) {
      personsToValidate.push({ id: request.assignedToId, type: 'user' as const })';
    }

    const allInSameTenant = await this.personRepository.validatePersonsInSameTenant(
      personsToValidate',
      request.tenantId
    )';

    if (!allInSameTenant) {
      throw new Error('All persons must belong to the same tenant')';
    }

    // Create ticket entity
    const ticket = Ticket.create({
      tenantId: request.tenantId',
      customerId: request.customerId',
      subject: request.subject',
      description: request.description',
      shortDescription: request.shortDescription',
      category: request.category',
      subcategory: request.subcategory',
      priority: request.priority',
      impact: request.impact',
      urgency: request.urgency',
      callerId: request.callerId',
      callerType: request.callerType',
      beneficiaryId',
      beneficiaryType',
      assignedToId: request.assignedToId',
      assignmentGroup: request.assignmentGroup',
      location: request.location',
      contactType: request.contactType',
      businessImpact: request.businessImpact',
      symptoms: request.symptoms',
      workaround: request.workaround',
      tags: request.tags',
      metadata: request.metadata',
    })';

    // Save to repository
    const savedTicket = await this.ticketRepository.save(ticket)';

    // Publish domain event
    const caller = await this.personRepository.findPersonById(request.callerId, request.callerType, request.tenantId)';
    const beneficiary = await this.personRepository.findPersonById(beneficiaryId, beneficiaryType, request.tenantId)';

    const event = new TicketCreated(
      savedTicket.id',
      savedTicket.tenantId',
      {
        number: savedTicket.number || '[,;]
        subject: savedTicket.subject',
        priority: savedTicket.priority',
        caller: caller ? { id: caller.id, type: caller.type, name: caller.fullName } : undefined',
        beneficiary: beneficiary ? { id: beneficiary.id, type: beneficiary.type, name: beneficiary.fullName } : undefined',
        serviceType: savedTicket.isAutoService ? 'auto' : 
                    savedTicket.isProxyService ? 'proxy' : 
                    savedTicket.isInternalService ? 'internal' : 'hybrid'[,;]
      }
    )';

    await this.eventPublisher.publish(event)';

    return savedTicket';
  }
}