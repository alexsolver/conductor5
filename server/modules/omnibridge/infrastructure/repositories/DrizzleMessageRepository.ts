import { db } from '../../../../db';
import * as schema from '../../../../../shared/schema';
import { MessageEntity } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { eq, and, desc, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class DrizzleMessageRepository implements IMessageRepository {
  async findById(id: string, tenantId: string): Promise<MessageEntity | null> {
    if (!tenantId) throw new Error('Tenant ID required');

    const result = await db.select().from(schema.omnibridgeMessages)
      .where(and(
        eq(schema.omnibridgeMessages.id, id),
        eq(schema.omnibridgeMessages.tenantId, tenantId)
      ))
      .limit(1);

    if (result.length === 0) return null;

    const message = result[0];
    return new MessageEntity(
      message.id,
      message.channelId,
      message.channelType,
      message.fromAddress || '',
      message.content || '',
      message.tenantId,
      message.toAddress,
      message.subject,
      message.metadata || {},
      message.status as any || 'unread',
      message.priority as any || 'medium',
      undefined, // category
      message.tags as string[] || [],
      message.timestamp,
      undefined, // processedAt
      message.createdAt,
      message.updatedAt
    );
  }

  async findByTenant(tenantId: string, limit: number = 50, offset: number = 0): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db.select().from(schema.omnibridgeMessages)
      .where(eq(schema.omnibridgeMessages.tenantId, tenantId))
      .orderBy(desc(schema.omnibridgeMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(message => new MessageEntity(
      message.id,
      message.channelId,
      message.channelType,
      message.fromAddress || '',
      message.content || '',
      message.tenantId,
      message.toAddress,
      message.subject,
      message.metadata || {},
      message.status as any || 'unread',
      message.priority as any || 'medium',
      undefined, // category
      message.tags as string[] || [],
      message.timestamp,
      undefined, // processedAt
      message.createdAt,
      message.updatedAt
    ));
  }

  async findByChannel(channelId: string, tenantId: string): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db.select().from(schema.omnibridgeMessages)
      .where(and(
        eq(schema.omnibridgeMessages.tenantId, tenantId),
        eq(schema.omnibridgeMessages.channelId, channelId)
      ))
      .orderBy(desc(schema.omnibridgeMessages.createdAt));

    return results.map(message => new MessageEntity(
      message.id,
      message.channelId,
      message.channelType,
      message.fromAddress || '',
      message.content || '',
      message.tenantId,
      message.toAddress,
      message.subject,
      message.metadata || {},
      message.status as any || 'unread',
      message.priority as any || 'medium',
      undefined, // category
      message.tags as string[] || [],
      message.timestamp,
      undefined, // processedAt
      message.createdAt,
      message.updatedAt
    ));
  }

  async findByStatus(status: string, tenantId: string): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db.select().from(schema.omnibridgeMessages)
      .where(and(
        eq(schema.omnibridgeMessages.tenantId, tenantId),
        eq(schema.omnibridgeMessages.status, status)
      ))
      .orderBy(desc(schema.omnibridgeMessages.createdAt));

    return results.map(message => new MessageEntity(
      message.id,
      message.channelId,
      message.channelType,
      message.fromAddress || '',
      message.content || '',
      message.tenantId,
      message.toAddress,
      message.subject,
      message.metadata || {},
      message.status as any || 'unread',
      message.priority as any || 'medium',
      undefined, // category
      message.tags as string[] || [],
      message.timestamp,
      undefined, // processedAt
      message.createdAt,
      message.updatedAt
    ));
  }

  async findByPriority(priority: string, tenantId: string): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db.select().from(schema.omnibridgeMessages)
      .where(and(
        eq(schema.omnibridgeMessages.tenantId, tenantId),
        eq(schema.omnibridgeMessages.priority, priority)
      ))
      .orderBy(desc(schema.omnibridgeMessages.createdAt));

    return results.map(message => new MessageEntity(
      message.id,
      message.channelId,
      message.channelType,
      message.fromAddress || '',
      message.content || '',
      message.tenantId,
      message.toAddress,
      message.subject,
      message.metadata || {},
      message.status as any || 'unread',
      message.priority as any || 'medium',
      undefined, // category
      message.tags as string[] || [],
      message.timestamp,
      undefined, // processedAt
      message.createdAt,
      message.updatedAt
    ));
  }

  async create(message: MessageEntity): Promise<MessageEntity> {
    const result = await db.insert(schema.omnibridgeMessages).values({
      id: message.id,
      tenantId: message.tenantId,
      channelId: message.channelId,
      channelType: message.channelType,
      fromAddress: message.from,
      toAddress: message.to,
      subject: message.subject,
      content: message.body,
      metadata: message.metadata,
      status: message.status,
      priority: message.priority,
      tags: message.tags,
      timestamp: message.receivedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    }).returning();

    return message;
  }

  async update(message: MessageEntity): Promise<MessageEntity> {
    await db.update(schema.omnibridgeMessages).set({
      status: message.status,
      priority: message.priority,
      tags: message.tags,
      updatedAt: message.updatedAt
    }).where(
      and(
        eq(schema.omnibridgeMessages.id, message.id),
        eq(schema.omnibridgeMessages.tenantId, message.tenantId)
      )
    );

    return message;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required');

    await db.delete(schema.omnibridgeMessages).where(
      and(
        eq(schema.omnibridgeMessages.id, id),
        eq(schema.omnibridgeMessages.tenantId, tenantId)
      )
    );

    return true;
  }

  async markAsRead(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required');

    await db.update(schema.omnibridgeMessages).set({
      status: 'read',
      updatedAt: new Date()
    }).where(
      and(
        eq(schema.omnibridgeMessages.id, id),
        eq(schema.omnibridgeMessages.tenantId, tenantId)
      )
    );

    return true;
  }

  async markAsProcessed(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required');

    await db.update(schema.omnibridgeMessages).set({
      status: 'processed',
      updatedAt: new Date()
    }).where(
      and(
        eq(schema.omnibridgeMessages.id, id),
        eq(schema.omnibridgeMessages.tenantId, tenantId)
      )
    );

    return true;
  }
}