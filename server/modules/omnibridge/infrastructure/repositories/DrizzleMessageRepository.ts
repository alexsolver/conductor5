import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../../../shared/schema';
import { MessageEntity } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { eq, and, desc, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class DrizzleMessageRepository implements IMessageRepository {
  // ✅ 1QA.MD: Get tenant-specific database instance
  private async getTenantDb(tenantId: string) {
    const schemaName = this.getSchemaName(tenantId);
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      ssl: false,
    });
    return drizzle({ client: tenantPool, schema });
  }

  // ✅ 1QA.MD: Get tenant schema name
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  async findById(id: string, tenantId: string): Promise<MessageEntity | null> {
    if (!tenantId) throw new Error('Tenant ID required');

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select().from(schema.omnibridgeMessages)
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

    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select().from(schema.omnibridgeMessages)
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

    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select().from(schema.omnibridgeMessages)
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

    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select().from(schema.omnibridgeMessages)
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

    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select().from(schema.omnibridgeMessages)
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
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Creating message for tenant: ${message.tenantId}`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Message ID: ${message.id}`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Channel: ${message.channelId} (${message.channelType})`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] From: ${message.from}`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Content: ${message.body?.substring(0, 100)}...`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Full message data:`, JSON.stringify({
      id: message.id,
      tenantId: message.tenantId,
      channelId: message.channelId,
      channelType: message.channelType,
      fromAddress: message.from,
      toAddress: message.to,
      subject: message.subject,
      content: message.body,
      status: message.status,
      priority: message.priority
    }, null, 2));

    try {
      const tenantDb = await this.getTenantDb(message.tenantId);
      const result = await tenantDb.insert(schema.omnibridgeMessages).values({
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

      console.log(`✅ [DRIZZLE-MESSAGE-REPO] Message created successfully in database`);
      console.log(`✅ [DRIZZLE-MESSAGE-REPO] Database result:`, JSON.stringify(result, null, 2));
      
      // Verificar se a mensagem foi realmente criada
      const verification = await tenantDb.select().from(schema.omnibridgeMessages)
        .where(eq(schema.omnibridgeMessages.id, message.id))
        .limit(1);
      
      console.log(`🔍 [DRIZZLE-MESSAGE-REPO] Verification query result:`, JSON.stringify(verification, null, 2));
      
      return message;
    } catch (error) {
      console.error(`❌ [DRIZZLE-MESSAGE-REPO] Error creating message:`, error);
      throw error;
    }
  }

  async update(message: MessageEntity): Promise<MessageEntity> {
    const tenantDb = await this.getTenantDb(message.tenantId);
    await tenantDb.update(schema.omnibridgeMessages).set({
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

    const tenantDb = await this.getTenantDb(tenantId);
    await tenantDb.delete(schema.omnibridgeMessages).where(
      and(
        eq(schema.omnibridgeMessages.id, id),
        eq(schema.omnibridgeMessages.tenantId, tenantId)
      )
    );

    return true;
  }

  async markAsRead(id: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required');

    const tenantDb = await this.getTenantDb(tenantId);
    await tenantDb.update(schema.omnibridgeMessages).set({
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

    const tenantDb = await this.getTenantDb(tenantId);
    await tenantDb.update(schema.omnibridgeMessages).set({
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

  async updateTags(messageId: string, tenantId: string, tags: string[]): Promise<void> {
    console.log(`🏷️ [DrizzleMessageRepository] Updating tags for message: ${messageId}`);

    try {
      const tenantDb = await this.getTenantDb(tenantId);
      await tenantDb.execute(`
        UPDATE omnibridge_messages SET
          tags = $1, updated_at = $2
        WHERE id = $3 AND tenant_id = $4
      `, [
        JSON.stringify(tags),
        new Date(),
        messageId,
        tenantId
      ]);

      console.log(`✅ [DrizzleMessageRepository] Updated tags for message: ${messageId}`);
    } catch (error) {
      console.error(`❌ [DrizzleMessageRepository] Error updating tags: ${error.message}`);
      throw error;
    }
  }

  async updatePriority(messageId: string, tenantId: string, priority: string): Promise<void> {
    console.log(`⚡ [DrizzleMessageRepository] Updating priority for message: ${messageId}`);

    try {
      const tenantDb = await this.getTenantDb(tenantId);
      await tenantDb.execute(`
        UPDATE omnibridge_messages SET
          priority = $1, updated_at = $2
        WHERE id = $3 AND tenant_id = $4
      `, [
        priority,
        new Date(),
        messageId,
        tenantId
      ]);

      console.log(`✅ [DrizzleMessageRepository] Updated priority for message: ${messageId}`);
    } catch (error) {
      console.error(`❌ [DrizzleMessageRepository] Error updating priority: ${error.message}`);
      throw error;
    }
  }

  async updateStatus(messageId: string, tenantId: string, status: string): Promise<void> {
    console.log(`🔄 [DrizzleMessageRepository] Updating status for message: ${messageId}`);

    try {
      const tenantDb = await this.getTenantDb(tenantId);
      await tenantDb.execute(`
        UPDATE omnibridge_messages SET
          status = $1, updated_at = $2
        WHERE id = $3 AND tenant_id = $4
      `, [
        status,
        new Date(),
        messageId,
        tenantId
      ]);

      console.log(`✅ [DrizzleMessageRepository] Updated status for message: ${messageId}`);
    } catch (error) {
      console.error(`❌ [DrizzleMessageRepository] Error updating status: ${error.message}`);
      throw error;
    }
  }

  private mapRowToMessage(row: any): Message {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      channelId: row.channel_id,
      channelType: row.channel_type as any,
      from: row.from_address,
      to: row.to_address,
      subject: row.subject,
      content: row.content,
      timestamp: new Date(row.timestamp),
      status: row.status as any,
      priority: row.priority as any,
      tags: JSON.parse(row.tags || '[]'),
      attachments: row.attachments || 0,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}