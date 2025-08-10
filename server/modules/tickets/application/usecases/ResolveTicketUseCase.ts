/**
 * Resolve Ticket Use Case
 * Clean Architecture - Application Layer
 */

import { Ticket } from '../../domain/entities/Ticket';
import { ITicketRepository } from '../../domain/ports/ITicketRepository';
import { IDomainEventPublisher } from '../../../shared/domain/IDomainEventPublisher';
import { TicketResolvedEvent } from '../../domain/events/TicketResolvedEvent';

export interface ResolveTicketInput {
  ticketId: string;
  tenantId: string;
  resolvedById: string;
  resolutionCode: string;
  resolutionNotes: string;
}

export interface ResolveTicketOutput {
  success: boolean;
  ticket?: Ticket;
  error?: string;
}

export class ResolveTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(input: ResolveTicketInput): Promise<ResolveTicketOutput> {
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

      // Resolve ticket using domain logic
      const resolvedTicket = existingTicket.resolve(
        input.resolutionCode,
        input.resolutionNotes
      );

      // Save ticket
      const savedTicket = await this.ticketRepository.save(resolvedTicket);

      // Calculate resolution time in minutes
      const resolutionTime = Math.floor(
        (savedTicket.getResolvedAt()!.getTime() - savedTicket.getCreatedAt().getTime()) / (1000 * 60)
      );

      // Domain events removed from use case - should be handled by application layer
      // Clean Architecture: Use Cases should not handle events directly

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