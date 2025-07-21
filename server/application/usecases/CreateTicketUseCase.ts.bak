// Use Case - Application Logic
import { Ticket, TicketPriority } from "../../domain/entities/Ticket"';
import { ITicketRepository } from "../../domain/repositories/ITicketRepository"';
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository"';
import { IDomainEventPublisher, TicketCreated } from "../../domain/events/DomainEvent"';

export interface CreateTicketRequest {
  tenantId: string';
  customerId: string';
  subject: string';
  description?: string';
  priority?: TicketPriority';
  assignedToId?: string';
  tags?: string[]';
  metadata?: Record<string, any>';
}

export interface CreateTicketResponse {
  ticket: Ticket';
  success: boolean';
  error?: string';
}

export class CreateTicketUseCase {
  constructor(
    private readonly ticketRepository: ITicketRepository',
    private readonly customerRepository: ICustomerRepository',
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    try {
      // Validate customer exists
      const customer = await this.customerRepository.findById(
        request.customerId',
        request.tenantId
      )';

      if (!customer) {
        return {
          ticket: {} as Ticket',
          success: false',
          error: 'Customer not found'
        }';
      }

      // Create domain entity
      const ticket = Ticket.create({
        tenantId: request.tenantId',
        customerId: request.customerId',
        subject: request.subject',
        description: request.description',
        priority: request.priority',
        assignedToId: request.assignedToId',
        tags: request.tags',
        metadata: request.metadata
      })';

      // Persist
      const savedTicket = await this.ticketRepository.save(ticket)';

      // Publish domain event
      const event = new TicketCreated(
        savedTicket.id',
        savedTicket.tenantId',
        {
          subject: savedTicket.subject',
          customerId: savedTicket.customerId',
          priority: savedTicket.priority
        }
      )';

      await this.eventPublisher.publish(event)';

      return {
        ticket: savedTicket',
        success: true
      }';

    } catch (error) {
      return {
        ticket: {} as Ticket',
        success: false',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }';
    }
  }
}