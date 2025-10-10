/**
 * DOMAIN LAYER - QUEUE ENTITY
 * Seguindo Clean Architecture - Multi-tenant Chat Queue
 */

export type QueueStrategy = "fifo" | "priority" | "skill_based" | "round_robin" | "least_busy";

export interface Queue {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  strategy: QueueStrategy;
  maxConcurrentChats: number;
  maxWaitTime?: number; // seconds
  skills?: string[];
  autoAssign: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
}

export interface QueueMember {
  id: string;
  tenantId: string;
  queueId: string;
  userId: string;
  skills?: string[];
  maxConcurrentChats: number;
  priority: number; // Higher = more priority
  isActive: boolean;
  createdAt: Date;
}

export interface QueueEntry {
  id: string;
  tenantId: string;
  queueId: string;
  customerId?: string;
  customerName?: string;
  customerChannel?: string;
  customerIdentifier?: string;
  conversationId?: string;
  status: "waiting" | "assigned" | "in_progress" | "completed" | "cancelled" | "timeout";
  priority: number;
  assignedAgentId?: string;
  assignedAt?: Date;
  chatId?: string;
  waitStartedAt: Date;
  waitEndedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
  slaExceeded: boolean;
  escalated: boolean;
  escalatedAt?: Date;
}

export class QueueDomainService {
  /**
   * Validates queue business rules
   */
  validate(queue: Partial<Queue>): boolean {
    if (!queue.name || queue.name.trim().length === 0) {
      throw new Error('Queue name is required');
    }

    if (!queue.strategy) {
      throw new Error('Queue strategy is required');
    }

    const validStrategies: QueueStrategy[] = ["fifo", "priority", "skill_based", "round_robin", "least_busy"];
    if (!validStrategies.includes(queue.strategy)) {
      throw new Error('Invalid queue strategy');
    }

    if (queue.maxConcurrentChats && queue.maxConcurrentChats < 1) {
      throw new Error('Max concurrent chats must be at least 1');
    }

    return true;
  }

  /**
   * Calculate wait time for an entry
   */
  calculateWaitTime(entry: QueueEntry): number {
    const now = new Date();
    const waitTime = Math.floor((now.getTime() - entry.waitStartedAt.getTime()) / 1000);
    return waitTime;
  }

  /**
   * Check if SLA is exceeded
   */
  isSLAExceeded(entry: QueueEntry, maxWaitTime: number): boolean {
    const waitTime = this.calculateWaitTime(entry);
    return waitTime > maxWaitTime;
  }

  /**
   * Calculate position in queue (FIFO)
   */
  calculatePosition(allEntries: QueueEntry[], entryId: string): number {
    const sortedEntries = allEntries
      .filter(e => e.status === 'waiting')
      .sort((a, b) => {
        // Priority first
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // Then by time
        return a.waitStartedAt.getTime() - b.waitStartedAt.getTime();
      });

    return sortedEntries.findIndex(e => e.id === entryId) + 1;
  }
}
