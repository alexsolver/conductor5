/**
 * SEND MESSAGE USE CASE
 * Application Layer - Clean Architecture
 */

import { v4 as uuidv4 } from 'uuid';
import { Message, MessageDomainService } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { IChatRepository } from '../../domain/repositories/IChatRepository';

export interface SendMessageRequest {
  tenantId: string;
  chatId: string;
  senderId?: string;
  senderName?: string;
  type: "text" | "file" | "image" | "system";
  content?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  metadata?: Record<string, any>;
}

export class SendMessageUseCase {
  private messageService: MessageDomainService;

  constructor(
    private messageRepository: IMessageRepository,
    private chatRepository: IChatRepository
  ) {
    this.messageService = new MessageDomainService();
  }

  async execute(request: SendMessageRequest): Promise<Message> {
    // 1. Validate chat exists and is active
    const chat = await this.chatRepository.findChatById(request.chatId, request.tenantId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.status !== 'active') {
      throw new Error('Cannot send message to inactive chat');
    }

    // 2. Create message
    const message: Message = {
      id: uuidv4(),
      tenantId: request.tenantId,
      chatId: request.chatId,
      senderId: request.senderId,
      senderName: request.senderName,
      type: request.type,
      content: request.content,
      attachmentUrl: request.attachmentUrl,
      attachmentType: request.attachmentType,
      attachmentName: request.attachmentName,
      metadata: request.metadata || {},
      isRead: false,
      readBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
    };

    // 3. Validate business rules
    this.messageService.validate(message);

    // 4. Save message
    const createdMessage = await this.messageRepository.createMessage(message);

    // 5. Update chat's updatedAt
    await this.chatRepository.updateChat(chat.id, {
      updatedAt: new Date(),
    });

    return createdMessage;
  }
}
