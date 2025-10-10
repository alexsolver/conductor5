/**
 * ASSIGN AGENT TO CHAT USE CASE
 * Application Layer - Assign agent from queue using distribution strategy
 */

import { v4 as uuidv4 } from 'uuid';
import { QueueEntry } from '../../domain/entities/Queue';
import { Chat } from '../../domain/entities/Chat';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { IAgentStatusRepository } from '../../domain/repositories/IAgentStatusRepository';
import { QueueDistributionService } from '../../domain/services/QueueDistributionService';

export interface AssignAgentRequest {
  tenantId: string;
  queueEntryId: string;
}

export interface AssignAgentResponse {
  success: boolean;
  chat?: Chat;
  entry?: QueueEntry;
  message: string;
}

export class AssignAgentToChatUseCase {
  private distributionService: QueueDistributionService;

  constructor(
    private queueRepository: IQueueRepository,
    private chatRepository: IChatRepository,
    private agentStatusRepository: IAgentStatusRepository
  ) {
    this.distributionService = new QueueDistributionService();
  }

  async execute(request: AssignAgentRequest): Promise<AssignAgentResponse> {
    // 1. Get queue entry
    const entry = await this.queueRepository.findEntryById(request.queueEntryId, request.tenantId);
    if (!entry) {
      return { success: false, message: 'Queue entry not found' };
    }

    if (entry.status !== 'waiting') {
      return { success: false, message: 'Entry is not waiting' };
    }

    // 2. Get queue
    const queue = await this.queueRepository.findQueueById(entry.queueId, request.tenantId);
    if (!queue) {
      return { success: false, message: 'Queue not found' };
    }

    // 3. Get available agents
    const queueMembers = await this.queueRepository.findQueueMembers(queue.id, request.tenantId);
    const agentStatuses = await this.agentStatusRepository.findAll(request.tenantId);

    // 4. Use distribution service to find best agent
    const distributionResult = await this.distributionService.distribute({
      queue,
      entry,
      availableAgents: queueMembers,
      agentStatuses
    });

    if (!distributionResult.agentId) {
      return { 
        success: false, 
        message: 'No available agents',
        entry: await this.queueRepository.updateEntry(entry.id, { 
          tenantId: request.tenantId, // ✅ FIX: Include tenantId
          status: 'timeout' 
        })
      };
    }

    // 5. Create chat
    const chat: Chat = {
      id: uuidv4(),
      tenantId: request.tenantId,
      type: 'support',
      status: 'active',
      title: entry.customerName || 'Support Chat',
      queueId: queue.id,
      queueEntryId: entry.id,
      conversationId: entry.conversationId,
      customerId: entry.customerId,
      customerChannel: entry.customerChannel,
      assignedAgentId: distributionResult.agentId,
      transferHistory: [],
      metadata: { assignmentReason: distributionResult.reason },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdChat = await this.chatRepository.createChat(chat);

    // 6. Update queue entry
    const updatedEntry = await this.queueRepository.updateEntry(entry.id, {
      tenantId: request.tenantId, // ✅ FIX: Include tenantId
      status: 'assigned',
      assignedAgentId: distributionResult.agentId,
      assignedAt: new Date(),
      chatId: createdChat.id,
      waitEndedAt: new Date(),
    });

    // 7. Update agent status (increment chat count)
    const agentStatus = await this.agentStatusRepository.findByUserId(
      distributionResult.agentId,
      request.tenantId
    );

    if (agentStatus) {
      await this.agentStatusRepository.update(distributionResult.agentId, request.tenantId, {
        currentChatsCount: agentStatus.currentChatsCount + 1,
        status: (agentStatus.currentChatsCount + 1) >= agentStatus.maxConcurrentChats ? 'busy' : 'available',
        lastActivityAt: new Date(),
      });
    }

    return {
      success: true,
      chat: createdChat,
      entry: updatedEntry,
      message: `Assigned to agent: ${distributionResult.reason}`,
    };
  }
}
