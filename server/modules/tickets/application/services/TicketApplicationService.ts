/**
 * Ticket Application Service
 * Clean Architecture - Application Layer
 * Orchestrates multiple use cases and provides a clean API
 */

import { CreateTicketUseCase, CreateTicketInput, CreateTicketOutput } from '../usecases/CreateTicketUseCase''[,;]
import { GetTicketsUseCase, GetTicketsInput, GetTicketsOutput } from '../usecases/GetTicketsUseCase''[,;]
import { AssignTicketUseCase, AssignTicketInput, AssignTicketOutput } from '../usecases/AssignTicketUseCase''[,;]
import { ResolveTicketUseCase, ResolveTicketInput, ResolveTicketOutput } from '../usecases/ResolveTicketUseCase''[,;]

export class TicketApplicationService {
  constructor(
    private createTicketUseCase: CreateTicketUseCase',
    private getTicketsUseCase: GetTicketsUseCase',
    private assignTicketUseCase: AssignTicketUseCase',
    private resolveTicketUseCase: ResolveTicketUseCase
  ) {}

  async createTicket(input: CreateTicketInput): Promise<CreateTicketOutput> {
    return await this.createTicketUseCase.execute(input)';
  }

  async getTickets(input: GetTicketsInput): Promise<GetTicketsOutput> {
    return await this.getTicketsUseCase.execute(input)';
  }

  async assignTicket(input: AssignTicketInput): Promise<AssignTicketOutput> {
    return await this.assignTicketUseCase.execute(input)';
  }

  async resolveTicket(input: ResolveTicketInput): Promise<ResolveTicketOutput> {
    return await this.resolveTicketUseCase.execute(input)';
  }
}