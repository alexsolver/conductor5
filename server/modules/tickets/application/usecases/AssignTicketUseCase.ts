/**
 * Assign Ticket Use Case
 * Clean Architecture - Application Layer
 */

import { Ticket } from '../../domain/entities/Ticket';
import { ITicketRepository } from '../../domain/ports/ITicketRepository';
import { IDomainEventPublisher } from '../../../shared/domain/IDomainEventPublisher';
import { TicketAssignedEvent } from '../../domain/events/TicketAssignedEvent';

export interface AssignTicketInput {
  ticketId: string;
  tenantId: string;
  assignedToId: string;
  assignedById: string; // User making the assignment
  assignmentGroup?: string;
}

export interface AssignTicketOutput {
  success: boolean;
  ticket?: Ticket;
  error?: string;
}

export class AssignTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(input: AssignTicketInput): Promise<AssignTicketOutput> {
    try {
      // Find existing ticket
      const existingTicket = await this.ticketRepository.findById(
        input.ticketId,
        input.tenantId
      );

      if (!existingTicket) {
        return {
          success: false,
          error: 'Ticket not found'
        };
      }

      // Assign ticket using domain logic
      const assignedTicket = existingTicket.assign(
        input.assignedToId,
        input.assignmentGroup
      );

      // Save ticket
      const savedTicket = await this.ticketRepository.save(assignedTicket);

      // Publish domain event
      const event = new TicketAssignedEvent(
        savedTicket.getId(),
        savedTicket.getTenantId(),
        input.assignedToId,
        input.assignedById,
        savedTicket.getPriority(),
        new Date()
      );
      
      await this.eventPublisher.publish(event);

      return {
        success: true,
        ticket: savedTicket
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}