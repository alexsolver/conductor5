/**
 * ADD TO QUEUE USE CASE
 * Application Layer - Add customer/entry to queue
 */

import { v4 as uuidv4 } from 'uuid';
import { QueueEntry } from '../../domain/entities/Queue';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';

export interface AddToQueueRequest {
  tenantId: string;
  queueId: string;
  customerId?: string;
  customerName?: string;
  customerChannel?: string;
  customerIdentifier?: string;
  conversationId?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export class AddToQueueUseCase {
  constructor(private queueRepository: IQueueRepository) {}

  async execute(request: AddToQueueRequest): Promise<QueueEntry> {
    // Verify queue exists
    const queue = await this.queueRepository.findQueueById(request.queueId, request.tenantId);
    if (!queue) {
      throw new Error('Queue not found');
    }

    if (!queue.isActive) {
      throw new Error('Queue is not active');
    }

    // Check if customer already in queue
    if (request.conversationId) {
      const existing = await this.queueRepository.findEntriesByConversation(
        request.conversationId,
        request.tenantId
      );
      
      if (existing && existing.status === 'waiting') {
        throw new Error('Customer already in queue');
      }
    }

    const entry: QueueEntry = {
      id: uuidv4(),
      tenantId: request.tenantId,
      queueId: request.queueId,
      customerId: request.customerId,
      customerName: request.customerName,
      customerChannel: request.customerChannel,
      customerIdentifier: request.customerIdentifier,
      conversationId: request.conversationId,
      status: 'waiting',
      priority: request.priority || 1,
      waitStartedAt: new Date(),
      metadata: request.metadata || {},
      slaExceeded: false,
      escalated: false,
    };

    return await this.queueRepository.createEntry(entry);
  }
}
