import { db, pool } from '../../../../db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../../../shared/schema';
import { MessageEntity } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

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

  async findByTenant(tenantId: string, limit: number = 200, offset: number = 0): Promise<MessageEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    console.log(`📧 [DRIZZLE-MESSAGE-REPO] Finding messages for tenant: ${tenantId}, limit: ${limit}, offset: ${offset}`);

    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select().from(schema.omnibridgeMessages)
      .where(eq(schema.omnibridgeMessages.tenantId, tenantId))
      .orderBy(desc(schema.omnibridgeMessages.createdAt))
      .limit(limit)
      .offset(offset);

    console.log(`📧 [DRIZZLE-MESSAGE-REPO] Found ${results.length} messages in database`);
    if (results.length > 0) {
      console.log(`📧 [DRIZZLE-MESSAGE-REPO] Sample message:`, {
        id: results[0].id,
        from: results[0].fromAddress,
        subject: results[0].subject,
        channelType: results[0].channelType,
        createdAt: results[0].createdAt
      });
    }

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

  async create(message: MessageEntity | any, tenantId?: string): Promise<MessageEntity> {
    // Handle both MessageEntity and simple objects
    const messageData = message instanceof MessageEntity ? message : message;
    const actualTenantId = tenantId || messageData.tenantId;
    
    if (!actualTenantId) {
      throw new Error('Tenant ID is required for message creation');
    }
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Creating message for tenant: ${actualTenantId}`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Message ID: ${messageData.id}`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Channel: ${messageData.channelId} (${messageData.channelType})`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] From: ${messageData.from || messageData.fromAddress}`);
    console.log(`💾 [DRIZZLE-MESSAGE-REPO] Content: ${(messageData.body || messageData.content)?.substring(0, 100)}...`);

    try {
      const tenantDb = await this.getTenantDb(actualTenantId);
      const result = await tenantDb.insert(schema.omnibridgeMessages).values({
        id: messageData.id,
        tenantId: actualTenantId,
        channelId: messageData.channelId,
        channelType: messageData.channelType,
        fromAddress: messageData.from || messageData.fromAddress,
        toAddress: messageData.to || messageData.toAddress,
        subject: messageData.subject,
        content: messageData.body || messageData.content,
        metadata: messageData.metadata || {},
        status: messageData.status || 'unread',
        priority: messageData.priority || 'medium',
        tags: messageData.tags || [],
        timestamp: messageData.receivedAt || messageData.sentAt || new Date(),
        createdAt: messageData.createdAt || new Date(),
        updatedAt: messageData.updatedAt || new Date()
      }).returning();

      console.log(`✅ [DRIZZLE-MESSAGE-REPO] Message created successfully in database`);
      console.log(`✅ [DRIZZLE-MESSAGE-REPO] Database result:`, JSON.stringify(result, null, 2));
      
      // Verificar se a mensagem foi realmente criada
      const verification = await tenantDb.select().from(schema.omnibridgeMessages)
        .where(eq(schema.omnibridgeMessages.id, message.id))
        .limit(1);
      
      console.log(`🔍 [DRIZZLE-MESSAGE-REPO] Verification query result:`, JSON.stringify(verification, null, 2));
      
      // Return MessageEntity if input was MessageEntity, otherwise return the created data
      if (message instanceof MessageEntity) {
        return message;
      } else {
        // Convert simple object to MessageEntity for consistent return type
        return new MessageEntity(
          messageData.id,
          messageData.channelId,
          messageData.channelType,
          messageData.from || messageData.fromAddress,
          messageData.body || messageData.content,
          actualTenantId,
          messageData.to || messageData.toAddress,
          messageData.subject,
          messageData.metadata || {},
          messageData.status || 'unread',
          messageData.priority || 'medium',
          undefined,
          messageData.tags || [],
          messageData.receivedAt || messageData.sentAt || new Date(),
          undefined,
          messageData.createdAt || new Date(),
          messageData.updatedAt || new Date()
        );
      }
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
      metadata: message.metadata,
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

  async updateStatus(messageId: string, tenantId: string, status: string): Promise<boolean> {
    console.log(`🔄 [DrizzleMessageRepository] Updating status for message: ${messageId}`);

    try {
      const tenantDb = await this.getTenantDb(tenantId);
      await tenantDb.update(schema.omnibridgeMessages).set({
        status: status as any,
        updatedAt: new Date()
      }).where(
        and(
          eq(schema.omnibridgeMessages.id, messageId),
          eq(schema.omnibridgeMessages.tenantId, tenantId)
        )
      );

      console.log(`✅ [DrizzleMessageRepository] Updated status for message: ${messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ [DrizzleMessageRepository] Error updating status:`, error);
      throw error;
    }
  }

  async getUnreadCount(tenantId: string): Promise<number> {
    if (!tenantId) throw new Error('Tenant ID required');

    const tenantDb = await this.getTenantDb(tenantId);
    const result = await tenantDb.select({ count: sql<number>`count(*)` })
      .from(schema.omnibridgeMessages)
      .where(and(
        eq(schema.omnibridgeMessages.tenantId, tenantId),
        eq(schema.omnibridgeMessages.status, 'unread')
      ));

    return result[0]?.count || 0;
  }

  async getStatsByChannel(tenantId: string): Promise<Array<{ channelId: string; count: number }>> {
    if (!tenantId) throw new Error('Tenant ID required');

    const tenantDb = await this.getTenantDb(tenantId);
    const results = await tenantDb.select({
      channelId: schema.omnibridgeMessages.channelId,
      count: sql<number>`count(*)`
    })
      .from(schema.omnibridgeMessages)
      .where(eq(schema.omnibridgeMessages.tenantId, tenantId))
      .groupBy(schema.omnibridgeMessages.channelId);

    return results.map(row => ({
      channelId: row.channelId,
      count: row.count
    }));
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