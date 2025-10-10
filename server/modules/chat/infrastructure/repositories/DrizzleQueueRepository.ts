/**
 * DRIZZLE QUEUE REPOSITORY
 * Infrastructure Layer - Drizzle ORM implementation
 */

import { getTenantDb } from '@server/db';
import { 
  chatQueues, 
  queueMembers, 
  queueEntries 
} from '@shared/schema-chat';
import { eq, and, or } from 'drizzle-orm';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { Queue, QueueMember, QueueEntry } from '../../domain/entities/Queue';

export class DrizzleQueueRepository implements IQueueRepository {
  // Queue operations
  async createQueue(queue: Queue): Promise<Queue> {
    const db = await getTenantDb(queue.tenantId);
    const [created] = await db.insert(chatQueues).values(queue).returning();
    return created as Queue;
  }

  async updateQueue(id: string, data: Partial<Queue>): Promise<Queue> {
    const tenantId = data.tenantId!;
    const db = await getTenantDb(tenantId);
    const [updated] = await db
      .update(chatQueues)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(chatQueues.id, id), eq(chatQueues.tenantId, tenantId)))
      .returning();
    return updated as Queue;
  }

  async findQueueById(id: string, tenantId: string): Promise<Queue | null> {
    const db = await getTenantDb(tenantId);
    const [queue] = await db
      .select()
      .from(chatQueues)
      .where(and(eq(chatQueues.id, id), eq(chatQueues.tenantId, tenantId)))
      .limit(1);
    return queue as Queue || null;
  }

  async findQueuesByTenant(tenantId: string): Promise<Queue[]> {
    const db = await getTenantDb(tenantId);
    const queues = await db
      .select()
      .from(chatQueues)
      .where(eq(chatQueues.tenantId, tenantId))
      .orderBy(chatQueues.createdAt);
    return queues as Queue[];
  }

  async deleteQueue(id: string, tenantId: string): Promise<void> {
    const db = await getTenantDb(tenantId);
    await db
      .delete(chatQueues)
      .where(and(eq(chatQueues.id, id), eq(chatQueues.tenantId, tenantId)));
  }

  // Queue member operations
  async addMember(member: QueueMember): Promise<QueueMember> {
    const db = await getTenantDb(member.tenantId);
    const [created] = await db.insert(queueMembers).values(member).returning();
    return created as QueueMember;
  }

  async removeMember(id: string, tenantId: string): Promise<void> {
    const db = await getTenantDb(tenantId);
    await db
      .delete(queueMembers)
      .where(and(eq(queueMembers.id, id), eq(queueMembers.tenantId, tenantId)));
  }

  async findQueueMembers(queueId: string, tenantId: string): Promise<QueueMember[]> {
    const db = await getTenantDb(tenantId);
    const members = await db
      .select()
      .from(queueMembers)
      .where(
        and(
          eq(queueMembers.queueId, queueId),
          eq(queueMembers.tenantId, tenantId)
        )
      )
      .orderBy(queueMembers.priority);
    return members as QueueMember[];
  }

  async findMembersByUserId(userId: string, tenantId: string): Promise<QueueMember[]> {
    const db = await getTenantDb(tenantId);
    const members = await db
      .select()
      .from(queueMembers)
      .where(
        and(
          eq(queueMembers.userId, userId),
          eq(queueMembers.tenantId, tenantId),
          eq(queueMembers.isActive, true)
        )
      );
    return members as QueueMember[];
  }

  // Queue entry operations
  async createEntry(entry: QueueEntry): Promise<QueueEntry> {
    const db = await getTenantDb(entry.tenantId);
    const [created] = await db.insert(queueEntries).values(entry).returning();
    return created as QueueEntry;
  }

  async updateEntry(id: string, data: Partial<QueueEntry>): Promise<QueueEntry> {
    const tenantId = data.tenantId;
    
    if (!tenantId) {
      console.error('❌ [QUEUE-REPO] updateEntry called without tenantId', { id, data });
      throw new Error('tenantId is required for updateEntry operation');
    }
    
    const db = await getTenantDb(tenantId);
    const [updated] = await db
      .update(queueEntries)
      .set(data)
      .where(and(eq(queueEntries.id, id), eq(queueEntries.tenantId, tenantId)))
      .returning();
    return updated as QueueEntry;
  }

  async findEntryById(id: string, tenantId: string): Promise<QueueEntry | null> {
    const db = await getTenantDb(tenantId);
    const [entry] = await db
      .select()
      .from(queueEntries)
      .where(and(eq(queueEntries.id, id), eq(queueEntries.tenantId, tenantId)))
      .limit(1);
    return entry as QueueEntry || null;
  }

  async findEntriesByQueue(
    queueId: string,
    tenantId: string,
    status?: string
  ): Promise<QueueEntry[]> {
    const db = await getTenantDb(tenantId);
    
    const conditions = [
      eq(queueEntries.queueId, queueId),
      eq(queueEntries.tenantId, tenantId)
    ];

    if (status) {
      conditions.push(eq(queueEntries.status, status));
    }

    const entries = await db
      .select()
      .from(queueEntries)
      .where(and(...conditions))
      .orderBy(queueEntries.priority, queueEntries.waitStartedAt);

    return entries as QueueEntry[];
  }

  async findEntriesByConversation(
    conversationId: string,
    tenantId: string
  ): Promise<QueueEntry | null> {
    const db = await getTenantDb(tenantId);
    const [entry] = await db
      .select()
      .from(queueEntries)
      .where(
        and(
          eq(queueEntries.conversationId, conversationId),
          eq(queueEntries.tenantId, tenantId)
        )
      )
      .limit(1);
    return entry as QueueEntry || null;
  }

  async deleteEntry(id: string, tenantId: string): Promise<void> {
    const db = await getTenantDb(tenantId);
    await db
      .delete(queueEntries)
      .where(and(eq(queueEntries.id, id), eq(queueEntries.tenantId, tenantId)));
  }

  async findPendingEntriesForAgent(tenantId: string, userId: string): Promise<QueueEntry[]> {
    const db = await getTenantDb(tenantId);
    
    // First, get all queues where the user is a member
    const userQueues = await this.findMembersByUserId(userId, tenantId);
    const queueIds = userQueues.map(m => m.queueId);
    
    if (queueIds.length === 0) {
      return [];
    }
    
    // Get all waiting entries from those queues
    const entries = await db
      .select()
      .from(queueEntries)
      .where(
        and(
          eq(queueEntries.tenantId, tenantId),
          eq(queueEntries.status, 'waiting' as any)
        )
      )
      .orderBy(queueEntries.priority, queueEntries.waitStartedAt);
    
    return entries as QueueEntry[];
  }
}
