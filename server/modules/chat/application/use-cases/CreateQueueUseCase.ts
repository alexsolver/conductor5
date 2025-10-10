/**
 * CREATE QUEUE USE CASE
 * Application Layer - Clean Architecture
 */

import { v4 as uuidv4 } from 'uuid';
import { Queue, QueueDomainService } from '../../domain/entities/Queue';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';

export interface CreateQueueRequest {
  tenantId: string;
  name: string;
  description?: string;
  strategy: "fifo" | "priority" | "skill_based" | "round_robin" | "least_busy";
  maxConcurrentChats?: number;
  maxWaitTime?: number;
  skills?: string[];
  autoAssign?: boolean;
  createdById: string;
}

export class CreateQueueUseCase {
  private queueService: QueueDomainService;

  constructor(private queueRepository: IQueueRepository) {
    this.queueService = new QueueDomainService();
  }

  async execute(request: CreateQueueRequest): Promise<Queue> {
    const queue: Queue = {
      id: uuidv4(),
      tenantId: request.tenantId,
      name: request.name,
      description: request.description,
      strategy: request.strategy,
      maxConcurrentChats: request.maxConcurrentChats || 3,
      maxWaitTime: request.maxWaitTime,
      skills: request.skills || [],
      autoAssign: request.autoAssign !== false,
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: request.createdById,
    };

    // Validate business rules
    this.queueService.validate(queue);

    // Create queue
    return await this.queueRepository.createQueue(queue);
  }
}
