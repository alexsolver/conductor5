import { db } from '../../../../db';
import * as schema from '../../../../../shared/schema';
import { MessageEntity } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { eq, and, desc, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class DrizzleMessageRepository implements IMessageRepository {
  async findById(id: string, tenantId: string): Promise<MessageEntity | null> {
    if (!tenantId) throw new Error('Tenant ID required');

    const result = await db.query.emailMessages.findFirst({
      where: and(
        eq(schema.emailMessages.id, id),
        eq(schema.emailMessages.tenantId, tenantId)
      )
    });

    if (!result) return null;

    return new MessageEntity(
      result.id,
      result.channelId || 'email',
      'email',
      result.fromEmail,
      result.bodyText || result.bodyHtml || '',
      result.tenantId,
      result.toEmail,
      result.subject,
      result.metadata || {},
      result.isRead ? 'read' : 'unread',
      result.priority as any || 'medium',
      result.category,
      result.tags || [],
      result.emailDate,
      result.processedAt,
      result.createdAt,
      result.updatedAt
    );
  }

  async findByTenant(tenantId: string, limit: number = 50, offset: number = 0): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db.query.emailMessages.findMany({
      where: eq(schema.emailMessages.tenantId, tenantId),
      orderBy: desc(schema.emailMessages.createdAt),
      limit,
      offset
    });

    return results.map(result => new MessageEntity(
      result.id,
      result.channelId || 'email',
      'email',
      result.fromEmail,
      result.bodyText || result.bodyHtml || '',
      result.tenantId,
      result.toEmail,
      result.subject,
      result.metadata || {},
      result.isRead ? 'read' : 'unread',
      result.priority as any || 'medium',
      result.category,
      result.tags || [],
      result.emailDate,
      result.processedAt,
      result.createdAt,
      result.updatedAt
    ));
  }

  async findByChannel(channelId: string, tenantId: string): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db.query.emailMessages.findMany({
      where: and(
        eq(schema.emailMessages.tenantId, tenantId),
        eq(schema.emailMessages.channelId, channelId)
      ),
      orderBy: desc(schema.emailMessages.createdAt)
    });

    return results.map(result => new MessageEntity(
      result.id,
      result.channelId || 'email',
      'email',
      result.fromEmail,
      result.bodyText || result.bodyHtml || '',
      result.tenantId,
      result.toEmail,
      result.subject,
      result.metadata || {},
      result.isRead ? 'read' : 'unread',
      result.priority as any || 'medium',
      result.category,
      result.tags || [],
      result.emailDate,
      result.processedAt,
      result.createdAt,
      result.updatedAt
    ));
  }

  async findByStatus(status: string, tenantId: string): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const isRead = status === 'read';
    const results = await db.query.emailMessages.findMany({
      where: and(
        eq(schema.emailMessages.tenantId, tenantId),
        eq(schema.emailMessages.isRead, isRead)
      ),
      orderBy: desc(schema.emailMessages.createdAt)
    });

    return results.map(result => new MessageEntity(
      result.id,
      result.channelId || 'email',
      'email',
      result.fromEmail,
      result.bodyText || result.bodyHtml || '',
      result.tenantId,
      result.toEmail,
      result.subject,
      result.metadata || {},
      result.isRead ? 'read' : 'unread',
      result.priority as any || 'medium',
      result.category,
      result.tags || [],
      result.emailDate,
      result.processedAt,
      result.createdAt,
      result.updatedAt
    ));
  }

  async findByPriority(priority: string, tenantId: string): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db.query.emailMessages.findMany({
      where: and(
        eq(schema.emailMessages.tenantId, tenantId),
        eq(schema.emailMessages.priority, priority)
      ),
      orderBy: desc(schema.emailMessages.createdAt)
    });

    return results.map(result => new MessageEntity(
      result.id,
      result.channelId || 'email',
      'email',
      result.fromEmail,
      result.bodyText || result.bodyHtml || '',
      result.tenantId,
      result.toEmail,
      result.subject,
      result.metadata || {},
      result.isRead ? 'read' : 'unread',
      result.priority as any || 'medium',
      result.category,
      result.tags || [],
      result.emailDate,
      result.processedAt,
      result.createdAt,
      result.updatedAt
    ));
  }

  async create(message: MessageEntity): Promise<MessageEntity> {
    const result = await db.insert(schema.emailMessages).values({
      id: message.id,
      tenantId: message.tenantId,
      channelId: message.channelId,
      fromEmail: message.from,
      toEmail: message.to,
      subject: message.subject,
      bodyText: message.body,
      bodyHtml: message.body,
      metadata: message.metadata,
      isRead: message.status === 'read',
      priority: message.priority,
      category: message.category,
      tags: message.tags,
      emailDate: message.receivedAt,
      processedAt: message.processedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    }).returning();

    return message;
  }

  async update(message: MessageEntity): Promise<MessageEntity> {
    await db.update(schema.emailMessages).set({
      isRead: message.status === 'read',
      priority: message.priority,
      category: message.category,
      tags: message.tags,
      processedAt: message.processedAt,
      updatedAt: message.updatedAt
    }).where(
      and(
        eq(schema.emailMessages.id, message.id),
        eq(schema.emailMessages.tenantId, message.tenantId)
      )
    );

    return message;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required');

    await db.delete(schema.emailMessages).where(
      and(
        eq(schema.emailMessages.id, id),
        eq(schema.emailMessages.tenantId, tenantId)
      )
    );

    return true;
  }

  async markAsRead(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required');

    await db.update(schema.emailMessages).set({
      isRead: true,
      updatedAt: new Date()
    }).where(
      and(
        eq(schema.emailMessages.id, id),
        eq(schema.emailMessages.tenantId, tenantId)
      )
    );

    return true;
  }

  async markAsProcessed(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required');

    await db.update(schema.emailMessages).set({
      processedAt: new Date(),
      updatedAt: new Date()
    }).where(
      and(
        eq(schema.emailMessages.id, id),
        eq(schema.emailMessages.tenantId, tenantId)
      )
    );

    return true;
  }

  async getUnreadCount(tenantId: string): Promise<number> {
    if (!tenantId) throw new Error('Tenant ID required');

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.emailMessages)
      .where(
        and(
          eq(schema.emailMessages.tenantId, tenantId),
          eq(schema.emailMessages.isRead, false)
        )
      );

    return result[0]?.count || 0;
  }

  async getStatsByChannel(tenantId: string): Promise<Array<{ channelId: string; count: number }>> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db
      .select({
        channelId: schema.emailMessages.channelId,
        count: sql<number>`count(*)`
      })
      .from(schema.emailMessages)
      .where(eq(schema.emailMessages.tenantId, tenantId))
      .groupBy(schema.emailMessages.channelId);

    return results.map(r => ({
      channelId: r.channelId || 'email',
      count: r.count
    }));
  }
}