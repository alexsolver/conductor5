
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { Ticket } from '../../domain/entities/Ticket';
import { Logger } from '../../../utils/logger';

export interface GetTicketDetailsRequest {
  ticketId: string;
  tenantId: string;
}

export interface GetTicketDetailsResponse {
  ticket: Ticket | null;
  success: boolean;
  message?: string;
}

export class GetTicketDetailsUseCase {
  constructor(
    private ticketRepository: ITicketRepository,
    private logger: Logger
  ) {}

  async execute(request: GetTicketDetailsRequest): Promise<GetTicketDetailsResponse> {
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

      this.logger.info(`Buscando detalhes do ticket ${request.ticketId} para tenant ${request.tenantId}`);

      const ticket = await this.ticketRepository.findById(request.ticketId, request.tenantId);

      if (!ticket) {
        return {
          ticket: null,
          success: false,
          message: 'Ticket não encontrado'
        };
      }

      return {
        ticket,
        success: true,
        message: 'Detalhes do ticket recuperados com sucesso'
      };

    } catch (error) {
      this.logger.error('Erro ao buscar detalhes do ticket:', error);
      return {
        ticket: null,
        success: false,
        message: 'Erro interno ao buscar detalhes do ticket'
      };
    }
  }
}
