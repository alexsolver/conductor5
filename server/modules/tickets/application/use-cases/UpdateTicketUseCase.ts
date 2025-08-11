
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { Ticket } from '../../domain/entities/Ticket';
import { Logger } from '../../../utils/logger';

export interface UpdateTicketRequest {
  ticketId: string;
  tenantId: string;
  subject?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  categoryId?: string;
  subcategoryId?: string;
}

export interface UpdateTicketResponse {
  ticket: Ticket | null;
  success: boolean;
  message?: string;
}

export class UpdateTicketUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private logger: Logger
  ) {}

  async execute(request: UpdateTicketRequest): Promise<UpdateTicketResponse> {
    try {
      if (!request.ticketId) {
        return {
          ticket: null,
          success: false,
          message: 'ID do ticket é obrigatório'
        };
      }

      if (!request.tenantId) {
        return {
          ticket: null,
          success: false,
          message: 'Tenant ID é obrigatório'
        };
      }

      this.logger.info(`Atualizando ticket ${request.ticketId} para tenant ${request.tenantId}`);

      // Buscar ticket existente
      const existingTicket = await this.ticketRepository.findById(request.ticketId, request.tenantId);
      
      if (!existingTicket) {
        return {
          ticket: null,
          success: false,
          message: 'Ticket não encontrado'
        };
      }

      // Aplicar atualizações
      const updatedTicketData = {
        ...existingTicket,
        ...(request.subject && { subject: request.subject }),
        ...(request.description && { description: request.description }),
        ...(request.status && { status: request.status }),
        ...(request.priority && { priority: request.priority }),
        ...(request.assignedToId && { assignedToId: request.assignedToId }),
        ...(request.categoryId && { categoryId: request.categoryId }),
        ...(request.subcategoryId && { subcategoryId: request.subcategoryId }),
        updatedAt: new Date()
      };

      const updatedTicket = await this.ticketRepository.update(request.ticketId, updatedTicketData, request.tenantId);

      return {
        ticket: updatedTicket,
        success: true,
        message: 'Ticket atualizado com sucesso'
      };

    } catch (error) {
      this.logger.error('Erro ao atualizar ticket:', error);
      return {
        ticket: null,
        success: false,
        message: 'Erro interno ao atualizar ticket'
      };
    }
  }
}
