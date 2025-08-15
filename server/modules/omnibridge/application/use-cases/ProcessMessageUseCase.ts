
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { MessageEntity } from '../../domain/entities/Message';

export class ProcessMessageUseCase {
  constructor(private messageRepository: IMessageRepository) {}

  async execute(messageId: string, tenantId: string, action: 'read' | 'processed'): Promise<boolean> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!messageId) {
      throw new Error('Message ID is required');
    }

    // Verificar se a mensagem existe
    const message = await this.messageRepository.findById(messageId, tenantId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Processar a ação
    switch (action) {
      case 'read':
        return await this.messageRepository.markAsRead(messageId, tenantId);
      case 'processed':
        return await this.messageRepository.markAsProcessed(messageId, tenantId);
      default:
        throw new Error('Invalid action');
    }
  }
}
