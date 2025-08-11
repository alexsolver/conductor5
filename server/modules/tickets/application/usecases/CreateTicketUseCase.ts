/**
 * Create Ticket Use Case
 * Clean Architecture - Application Layer
 */

import { Ticket } from '../../domain/entities/Ticket';
import { TicketPriority } from '../../domain/value-objects/TicketPriority';
import { TicketStatus } from '../../domain/value-objects/TicketStatus';
import { ITicketRepository } from '../../domain/ports/ITicketRepository';
import { IDomainEventPublisher } from '../../../shared/domain/IDomainEventPublisher';
import { TicketCreatedEvent } from '../../domain/events/TicketCreatedEvent';
import { IIdGenerator } from '../../../shared/domain/ports/IIdGenerator';

export interface CreateTicketInput {
  tenantId: string;
  customerId: string;
  callerId: string;
  callerType: 'user' | 'customer';
  subject: string;
  description: string;
  shortDescription?: string;
  category?: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  impact?: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high';
  assignedToId?: string;
  beneficiaryId?: string;
  beneficiaryType?: 'user' | 'customer';
  assignmentGroup?: string;
  location?: string;
  contactType?: string;
  businessImpact?: string;
  symptoms?: string;
  workaround?: string;
  configurationItem?: string;
  businessService?: string;
  notify?: boolean;
}

export interface CreateTicketOutput {
  id: string;
  number: string;
  success: boolean;
  ticket?: Ticket;
  error?: string;
}

export class CreateTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventPublisher: IDomainEventPublisher,
    private idGenerator: IIdGenerator
  ) {}

  async execute(input: CreateTicketInput): Promise<CreateTicketOutput> {
    try {
      // Generate unique ticket number
      const ticketNumber = await this.ticketRepository.getNextTicketNumber(
        input.tenantId,
        'INC'
      );

      // Create new ticket
      // Using constructor directly since factory method was moved to repository layer
      const ticketId = this.idGenerator.generateId();
      const now = new Date();
      
      const ticket = new Ticket(
        ticketId, // id
        input.tenantId, // tenantId
        input.customerId, // customerId
        input.callerId, // callerId
        input.callerType, // callerType
        input.subject, // subject
        input.description || '', // description
        ticketNumber, // number
        input.shortDescription || input.subject, // shortDescription
        input.category || '', // category
        input.subcategory || '', // subcategory
        TicketPriority.create(input.priority), // priority
        input.impact || 'medium', // impact
        input.urgency || 'medium', // urgency
        TicketStatus.create('open'), // state
        'open', // status
        input.assignedToId || null, // assignedToId
        input.beneficiaryId || null, // beneficiaryId
        input.beneficiaryType || null, // beneficiaryType
        input.assignmentGroup || null, // assignmentGroup
        input.location || null, // location
        input.contactType || '', // contactType
        input.businessImpact || null, // businessImpact
        input.symptoms || null, // symptoms
        input.workaround || null, // workaround
        input.configurationItem || null, // configurationItem
        input.businessService || null, // businessService
        null, // resolutionCode
        null, // resolutionNotes
        null, // workNotes
        null, // closeNotes
        input.notify || false, // notify
        null, // rootCause
        now, // openedAt
        null, // resolvedAt
        null, // closedAt
        now, // createdAt
        now // updatedAt
      );

      // Save ticket - using create method instead of save
      const ticketResult = await this.ticketRepository.create(input, input.tenantId);

      // Return simple success response without domain events for now
      return {
        id: ticketResult.id || ticketId,
        number: ticketResult.number || ticketNumber,
        success: true,
        message: 'Ticket created successfully'
      };
    } catch (error) {
      return {
        id: '',
        number: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}