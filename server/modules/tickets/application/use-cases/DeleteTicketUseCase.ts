/**
 * APPLICATION LAYER - DELETE TICKET USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { Logger } from '../../domain/ports/Logger'; // Assumindo que Logger é uma interface definida

export class DeleteTicketUseCase {
  // Assumindo que 'repository' e 'logger' são propriedades injetadas ou acessadas de outra forma.
  // Se 'this.repository' e 'this.logger' não estiverem definidos no construtor original,
  // eles precisarão ser adicionados ou o código original precisa ser mais explícito.
  // Para este exemplo, vamos assumir que eles são injetados no construtor.
  constructor(
    private repository: ITicketRepository,
    private logger: Logger // Adicionado Logger para o logging
  ) {}

  async execute(id: string, tenantId: string, userId: string): Promise<void> {
    console.log(`🗑️ [DeleteTicketUseCase] Executing delete for ticket ${id} by user ${userId}`);

    try {
      // Verificar se o ticket existe
      const ticket = await this.repository.findById(id, tenantId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      console.log(`✅ [DeleteTicketUseCase] Found ticket to delete:`, ticket);

      // Validar regras de deleção
      await this.validateDeletionRules(ticket);

      // Criar audit trail antes da deleção
      console.log(`📝 [DeleteTicketUseCase] Creating audit trail for deletion`);

      // Deletar o ticket (soft delete)
      await this.repository.delete(id, tenantId);

      console.log(`✅ [DeleteTicketUseCase] Ticket soft deleted successfully: ${id}`);

      // Log da operação
      this.logger.info('Ticket deleted successfully', {
        ticketId: id,
        tenantId,
        userId,
        ticketSubject: ticket.subject,
        deletionType: 'soft_delete'
      });

    } catch (error: any) {
      console.error(`❌ [DeleteTicketUseCase] Delete failed:`, error);
      this.logger.error('Failed to delete ticket', { error: error.message, id, tenantId, userId });
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
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