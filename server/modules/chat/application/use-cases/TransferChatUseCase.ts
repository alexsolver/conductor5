/**
 * TRANSFER CHAT USE CASE
 * Application Layer - Transfer chat to another agent or queue
 */

import { Chat, TransferRecord } from '../../domain/entities/Chat';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAgentStatusRepository } from '../../domain/repositories/IAgentStatusRepository';

export interface TransferChatRequest {
  tenantId: string;
  chatId: string;
  toAgentId?: string;
  toQueueId?: string;
  reason?: string;
  notes?: string;
  initiatedById: string;
}

export interface TransferChatResponse {
  success: boolean;
  chat?: Chat;
  message: string;
}

export class TransferChatUseCase {
  constructor(
    private chatRepository: IChatRepository,
    private queueRepository: IQueueRepository,
    private agentStatusRepository: IAgentStatusRepository
  ) {}

  async execute(request: TransferChatRequest): Promise<TransferChatResponse> {
    // 1. Get chat
    const chat = await this.chatRepository.findChatById(request.chatId, request.tenantId);
    if (!chat) {
      return { success: false, message: 'Chat not found' };
    }

    if (chat.status !== 'active') {
      return { success: false, message: 'Chat is not active' };
    }

    const fromAgentId = chat.assignedAgentId;

    // 2. Transfer to agent
    if (request.toAgentId) {
      // Check if agent is available
      const toAgentStatus = await this.agentStatusRepository.findByUserId(
        request.toAgentId,
        request.tenantId
      );

      if (!toAgentStatus) {
        return { success: false, message: 'Target agent not found' };
      }

      if (toAgentStatus.status === 'offline') {
        return { success: false, message: 'Target agent is offline' };
      }

      if (toAgentStatus.currentChatsCount >= toAgentStatus.maxConcurrentChats) {
        return { success: false, message: 'Target agent is at capacity' };
      }

      // Create transfer record
      const transferRecord: TransferRecord = {
        fromAgentId,
        toAgentId: request.toAgentId,
        reason: request.reason,
        timestamp: new Date(),
      };

      // Update chat
      const updatedChat = await this.chatRepository.updateChat(chat.id, {
        assignedAgentId: request.toAgentId,
        transferHistory: [...(chat.transferHistory || []), transferRecord],
        updatedAt: new Date(),
      });

      // Update agent statuses
      if (fromAgentId) {
        const fromStatus = await this.agentStatusRepository.findByUserId(fromAgentId, request.tenantId);
        if (fromStatus) {
          await this.agentStatusRepository.update(fromAgentId, request.tenantId, {
            currentChatsCount: Math.max(0, fromStatus.currentChatsCount - 1),
            status: (fromStatus.currentChatsCount - 1) < fromStatus.maxConcurrentChats ? 'available' : 'busy',
          });
        }
      }

      await this.agentStatusRepository.update(request.toAgentId, request.tenantId, {
        currentChatsCount: toAgentStatus.currentChatsCount + 1,
        status: (toAgentStatus.currentChatsCount + 1) >= toAgentStatus.maxConcurrentChats ? 'busy' : 'available',
        lastActivityAt: new Date(),
      });

      return {
        success: true,
        chat: updatedChat,
        message: `Chat transferred to agent`,
      };
    }

    // 3. Transfer to queue
    if (request.toQueueId) {
      const queue = await this.queueRepository.findQueueById(request.toQueueId, request.tenantId);
      if (!queue) {
        return { success: false, message: 'Target queue not found' };
      }

      if (!queue.isActive) {
        return { success: false, message: 'Target queue is not active' };
      }

      // Create queue entry
      await this.queueRepository.createEntry({
        id: crypto.randomUUID(),
        tenantId: request.tenantId,
        queueId: request.toQueueId,
        customerId: chat.customerId,
        customerChannel: chat.customerChannel,
        conversationId: chat.conversationId,
        status: 'waiting',
        priority: 2, // Higher priority for transfers
        waitStartedAt: new Date(),
        metadata: { transferredFromChat: chat.id, reason: request.reason },
        slaExceeded: false,
        escalated: false,
      });

      // Create transfer record
      const transferRecord: TransferRecord = {
        fromAgentId,
        fromQueueId: chat.queueId,
        toQueueId: request.toQueueId,
        reason: request.reason,
        timestamp: new Date(),
      };

      // Close current chat
      const closedChat = await this.chatRepository.closeChat(chat.id, request.initiatedById);

      // Update transfer history
      const updatedChat = await this.chatRepository.updateChat(closedChat.id, {
        transferHistory: [...(chat.transferHistory || []), transferRecord],
      });

      // Decrement from agent count
      if (fromAgentId) {
        const fromStatus = await this.agentStatusRepository.findByUserId(fromAgentId, request.tenantId);
        if (fromStatus) {
          await this.agentStatusRepository.update(fromAgentId, request.tenantId, {
            currentChatsCount: Math.max(0, fromStatus.currentChatsCount - 1),
            status: (fromStatus.currentChatsCount - 1) < fromStatus.maxConcurrentChats ? 'available' : 'busy',
          });
        }
      }

      return {
        success: true,
        chat: updatedChat,
        message: `Chat transferred to queue`,
      };
    }

    return { success: false, message: 'No transfer target specified' };
  }
}
