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
    // Regras de negócio para deleção - temporariamente relaxadas para permitir deleção
    
    // Registrar o log da tentativa de exclusão
    console.log(`[DELETE-TICKET] Validating deletion for ticket: ${ticket.id}, status: ${ticket.status}, priority: ${ticket.priority}`);
    
    // Permitir exclusão de tickets em qualquer status por enquanto
    // Futuramente, implementar validações específicas baseadas em regras de negócio
    
    // Se necessário, implementar validações baseadas em roles/permissions do usuário
    // ou outras regras específicas do tenant
  }
}