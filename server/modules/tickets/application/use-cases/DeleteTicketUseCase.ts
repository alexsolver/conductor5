/**
 * APPLICATION LAYER - DELETE TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { ITicketRepository } from '../../domain/repositories/ITicketRepository';

export class DeleteTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository
  ) {}

  async execute(ticketId: string, tenantId: string, deletedById: string): Promise<void> {
    // Validação de entrada
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    if (!deletedById) {
      throw new Error('Deleted by user ID is required');
    }

    // Buscar ticket existente
    const existingTicket = await this.ticketRepository.findById(ticketId, tenantId);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    // Verificar se ticket já está inativo
    if (!existingTicket.isActive) {
      throw new Error('Ticket is already deleted');
    }

    // Aplicar regras de negócio para deleção
    await this.validateDeletionRules(existingTicket);

    // Soft delete - apenas marca como inativo
    await this.ticketRepository.delete(ticketId, tenantId);
  }

  private async validateDeletionRules(ticket: any): Promise<void> {
    // Regra de negócio: Não pode deletar tickets resolvidos ou fechados
    // (dependendo das regras de negócio específicas)
    if (ticket.status === 'closed') {
      throw new Error('Cannot delete closed tickets');
    }

    // Regra de negócio: Tickets com relacionamentos podem não ser deletáveis
    // (esta validação pode ser expandida conforme necessário)
    
    // Regra de negócio: Tickets críticos podem requerer aprovação especial
    if (ticket.priority === 'critical') {
      throw new Error('Critical tickets require special approval to delete');
    }
  }
}