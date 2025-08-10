/**
 * Create Ticket Use Case
 * Clean Architecture - Application Layer
 */

import { Ticket } from '../../domain/entities/Ticket';
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
      const ticket = Ticket.create({
        tenantId: input.tenantId,
        customerId: input.customerId,
        callerId: input.callerId,
        callerType: input.callerType,
        subject: input.subject,
        description: input.description,
        shortDescription: input.shortDescription,
        category: input.category,
        subcategory: input.subcategory,
        priority: input.priority,
        impact: input.impact,
        urgency: input.urgency,
        assignedToId: input.assignedToId,
        beneficiaryId: input.beneficiaryId,
        beneficiaryType: input.beneficiaryType,
        assignmentGroup: input.assignmentGroup,
        location: input.location,
        contactType: input.contactType,
        businessImpact: input.businessImpact,
        symptoms: input.symptoms,
        workaround: input.workaround,
        configurationItem: input.configurationItem,
        businessService: input.businessService,
        notify: input.notify
      }, ticketNumber, this.idGenerator);

      // Save ticket
      const savedTicket = await this.ticketRepository.save(ticket);

      // Publish domain event
      const event = new TicketCreatedEvent(
        savedTicket.getId(),
        savedTicket.getTenantId(),
        savedTicket.getCustomerId(),
        savedTicket.getCallerId(),
        savedTicket.getPriority().getValue(), // Convert TicketPriority to string
        savedTicket.getSubject(),
        new Date()
      );
      
      await this.eventPublisher.publish(event);

      return {
        id: savedTicket.getId(),
        number: savedTicket.getNumber(),
        success: true,
        ticket: savedTicket
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