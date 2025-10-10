/**
 * UPDATE QUEUE USE CASE
 * Application Layer - Clean Architecture
 */

import { Queue, QueueDomainService } from '../../domain/entities/Queue';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';

export interface UpdateQueueRequest {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  strategy?: "fifo" | "priority" | "skill_based" | "round_robin" | "least_busy";
  maxConcurrentChats?: number;
  maxWaitTime?: number;
  skills?: string[];
  autoAssign?: boolean;
  isActive?: boolean;
  updatedById: string;
}

export class UpdateQueueUseCase {
  private queueService: QueueDomainService;

  constructor(private queueRepository: IQueueRepository) {
    this.queueService = new QueueDomainService();
  }

  async execute(request: UpdateQueueRequest): Promise<Queue> {
    // Find existing queue
    const existing = await this.queueRepository.findQueueById(request.id, request.tenantId);
    if (!existing) {
      throw new Error('Queue not found');
    }

    // Prepare update data
    const updateData: Partial<Queue> = {
      ...request,
      updatedAt: new Date(),
    };

    // Validate if strategy is being changed
    if (request.strategy) {
      this.queueService.validate({ strategy: request.strategy } as Queue);
    }

    // Update queue
    return await this.queueRepository.updateQueue(request.id, updateData);
  }
}
