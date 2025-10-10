/**
 * QUEUE REPOSITORY INTERFACE
 * Clean Architecture - Domain Layer
 */

import { Queue, QueueMember, QueueEntry } from '../entities/Queue';

export interface IQueueRepository {
  // Queue operations
  createQueue(queue: Queue): Promise<Queue>;
  updateQueue(id: string, data: Partial<Queue>): Promise<Queue>;
  findQueueById(id: string, tenantId: string): Promise<Queue | null>;
  findQueuesByTenant(tenantId: string): Promise<Queue[]>;
  deleteQueue(id: string, tenantId: string): Promise<void>;

  // Queue member operations
  addMember(member: QueueMember): Promise<QueueMember>;
  removeMember(id: string, tenantId: string): Promise<void>;
  findQueueMembers(queueId: string, tenantId: string): Promise<QueueMember[]>;
  findMembersByUserId(userId: string, tenantId: string): Promise<QueueMember[]>;

  // Queue entry operations
  createEntry(entry: QueueEntry): Promise<QueueEntry>;
  updateEntry(id: string, data: Partial<QueueEntry>): Promise<QueueEntry>;
  findEntryById(id: string, tenantId: string): Promise<QueueEntry | null>;
  findEntriesByQueue(queueId: string, tenantId: string, status?: string): Promise<QueueEntry[]>;
  findEntriesByConversation(conversationId: string, tenantId: string): Promise<QueueEntry | null>;
  deleteEntry(id: string, tenantId: string): Promise<void>;
}
