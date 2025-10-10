/**
 * CREATE TICKET FROM CHAT USE CASE
 * Application Layer - Create ticket from chat with message history
 */

import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { CreateTicketUseCase } from '../../../tickets/application/use-cases/CreateTicketUseCase';
import { CreateTicketDTO } from '../../../tickets/application/dto/CreateTicketDTO';

export interface CreateTicketFromChatRequest {
  tenantId: string;
  chatId: string;
  subject?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  createdById: string;
}

export interface CreateTicketFromChatResponse {
  success: boolean;
  ticketId?: string;
  ticketNumber?: string;
  message: string;
}

export class CreateTicketFromChatUseCase {
  constructor(
    private chatRepository: IChatRepository,
    private messageRepository: IMessageRepository,
    private createTicketUseCase: CreateTicketUseCase
  ) {}

  async execute(request: CreateTicketFromChatRequest): Promise<CreateTicketFromChatResponse> {
    try {
      // 1. Get chat
      const chat = await this.chatRepository.findChatById(request.chatId, request.tenantId);
      if (!chat) {
        return { success: false, message: 'Chat not found' };
      }

      // 2. Get chat messages
      const messages = await this.messageRepository.findMessagesByChat(
        request.chatId,
        request.tenantId,
        { page: 1, limit: 100 }
      );

      // 3. Build ticket description from chat history
      let description = '### Histórico do Chat\n\n';
      for (const msg of messages) {
        const timestamp = new Date(msg.createdAt).toLocaleString('pt-BR');
        const sender = msg.senderName || 'Unknown';
        const content = msg.content || '[anexo]';
        description += `**${sender}** (${timestamp}):\n${content}\n\n`;
      }

      // 4. Create ticket
      const ticketDTO: CreateTicketDTO = {
        tenantId: request.tenantId,
        subject: request.subject || chat.title || 'Ticket do Chat',
        description,
        customerId: chat.customerId,
        category: request.category || 'Atendimento',
        priority: request.priority || 'medium',
        urgency: 'medium',
        impact: 'medium',
        status: 'open',
        createdById: request.createdById,
        metadata: {
          createdFromChat: true,
          chatId: chat.id,
          conversationId: chat.conversationId,
          customerChannel: chat.customerChannel,
          messageCount: messages.length
        }
      };

      const ticket = await this.createTicketUseCase.execute(ticketDTO);

      // 5. Update chat with ticket reference
      await this.chatRepository.updateChat(chat.id, {
        ticketId: ticket.id,
        updatedAt: new Date()
      });

      return {
        success: true,
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        message: `Ticket ${ticket.number} criado com sucesso a partir do chat`
      };
    } catch (error) {
      console.error('[CreateTicketFromChatUseCase] Error:', error);
      return {
        success: false,
        message: 'Erro ao criar ticket do chat',
      };
    }
  }
}
