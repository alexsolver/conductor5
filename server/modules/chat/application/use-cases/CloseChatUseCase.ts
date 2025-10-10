/**
 * CLOSE CHAT USE CASE
 * Application Layer - Close chat and update agent status
 */

import { Chat } from '../../domain/entities/Chat';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { IAgentStatusRepository } from '../../domain/repositories/IAgentStatusRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';

export interface CloseChatRequest {
  tenantId: string;
  chatId: string;
  closedById: string;
}

export class CloseChatUseCase {
  constructor(
    private chatRepository: IChatRepository,
    private agentStatusRepository: IAgentStatusRepository,
    private queueRepository: IQueueRepository
  ) {}

  async execute(request: CloseChatRequest): Promise<Chat> {
    // 1. Validate chat exists
    const chat = await this.chatRepository.findChatById(request.chatId, request.tenantId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.status === 'closed') {
      throw new Error('Chat is already closed');
    }

    // 2. Close chat
    const closedChat = await this.chatRepository.closeChat(request.chatId, request.closedById);

    // 3. Update queue entry if exists
    if (chat.queueEntryId) {
      await this.queueRepository.updateEntry(chat.queueEntryId, {
        status: 'completed',
        completedAt: new Date(),
      });
    }

    // 4. Update agent status (decrement chat count)
    if (chat.assignedAgentId) {
      const agentStatus = await this.agentStatusRepository.findByUserId(
        chat.assignedAgentId,
        request.tenantId
      );

      if (agentStatus) {
        const newCount = Math.max(0, agentStatus.currentChatsCount - 1);
        await this.agentStatusRepository.update(chat.assignedAgentId, request.tenantId, {
          currentChatsCount: newCount,
          status: newCount < agentStatus.maxConcurrentChats ? 'available' : 'busy',
          lastActivityAt: new Date(),
        });
      }
    }

    return closedChat;
  }
}
