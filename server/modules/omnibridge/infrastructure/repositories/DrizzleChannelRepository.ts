import { db } from '../../../../db';
import * as schema from '../../../../../shared/schema';
import { ChannelEntity } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { eq, and } from 'drizzle-orm';

export class DrizzleChannelRepository implements IChannelRepository {
  async findById(id: string, tenantId: string): Promise<ChannelEntity | null> {
    if (!tenantId) throw new Error('Tenant ID required');

    const result = await db
      .select()
      .from(schema.serviceIntegrations)
      .where(
        and(
          eq(schema.serviceIntegrations.id, id),
          eq(schema.serviceIntegrations.tenantId, tenantId)
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return new ChannelEntity(
      row.id,
      row.name,
      row.category.toLowerCase() as any,
      row.status as any,
      row.config || {},
      row.enabled,
      row.tenantId,
      row.createdAt,
      row.updatedAt
    );
  }

  async findByTenant(tenantId: string): Promise<ChannelEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db
      .select()
      .from(schema.serviceIntegrations)
      .where(eq(schema.serviceIntegrations.tenantId, tenantId));

    return results.map(row => new ChannelEntity(
      row.id,
      row.name,
      row.category.toLowerCase() as any,
      row.status as any,
      row.config || {},
      row.enabled,
      row.tenantId,
      row.createdAt,
      row.updatedAt
    ));
  }

  async findActiveByTenant(tenantId: string): Promise<ChannelEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db
      .select()
      .from(schema.serviceIntegrations)
      .where(
        and(
          eq(schema.serviceIntegrations.tenantId, tenantId),
          eq(schema.serviceIntegrations.enabled, true)
        )
      );

    return results.map(row => new ChannelEntity(
      row.id,
      row.name,
      row.category.toLowerCase() as any,
      row.status as any,
      row.config || {},
      row.enabled,
      row.tenantId,
      row.createdAt,
      row.updatedAt
    ));
  }

  async findByType(type: string, tenantId: string): Promise<ChannelEntity[]> {
    if (!tenantId) throw new Error('Tenant ID required');

    const results = await db
      .select()
      .from(schema.serviceIntegrations)
      .where(
        and(
          eq(schema.serviceIntegrations.tenantId, tenantId),
          eq(schema.serviceIntegrations.category, type)
        )
      );

    return results.map(row => new ChannelEntity(
      row.id,
      row.name,
      row.category.toLowerCase() as any,
      row.status as any,
      row.config || {},
      row.enabled,
      row.tenantId,
      row.createdAt,
      row.updatedAt
    ));
  }

  async create(channel: ChannelEntity): Promise<ChannelEntity> {
    // Channels são criados via Workspace Admin, não aqui
    // throw new Error('Channels should be created via Workspace Admin');

    const result = await db
      .insert(schema.serviceIntegrations)
      .values({
        id: channel.id,
        name: channel.name,
        category: channel.category,
        status: channel.status,
        config: channel.config,
        enabled: channel.isEnabled,
        tenantId: channel.tenantId,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt
      })
      .returning();

    return new ChannelEntity(
      result[0].id,
      result[0].name,
      result[0].category.toLowerCase() as any,
      result[0].status as any,
      result[0].config || {},
      result[0].enabled,
      result[0].tenantId,
      result[0].createdAt,
      result[0].updatedAt
    );
  }

  async update(id: string, data: Partial<ChannelEntity>, tenantId: string): Promise<ChannelEntity> {
    const [channel] = await db
      .update(schema.serviceIntegrations)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(schema.serviceIntegrations.id, id),
        eq(schema.serviceIntegrations.tenantId, tenantId)
      ))
      .returning();

    return new ChannelEntity(
      channel.id,
      channel.name,
      channel.category.toLowerCase() as any,
      channel.status as any,
      channel.config || {},
      channel.enabled,
      channel.tenantId,
      channel.createdAt,
      channel.updatedAt
    );
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Channels não podem ser deletados do OmniBridge
    throw new Error('Channels should be deleted via Workspace Admin');
  }

  async toggleStatus(id: string, tenantId: string, isEnabled: boolean): Promise<boolean> {
    if (!tenantId) throw new Error('Tenant ID required');

    const result = await db
      .update(schema.serviceIntegrations)
      .set({
        enabled: isEnabled,
        status: isEnabled ? 'connected' : 'disconnected',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(schema.serviceIntegrations.id, id),
          eq(schema.serviceIntegrations.tenantId, tenantId)
        )
      );

    return true;
  }

  async createOrUpdate(channelData: Omit<ChannelEntity, 'createdAt' | 'updatedAt'>): Promise<ChannelEntity> {
    try {
      // Check if channel exists
      const existing = await this.findById(channelData.id, channelData.tenantId);

      if (existing) {
        // Update existing channel
        return await this.update(channelData.id, channelData, channelData.tenantId);
      } else {
        // Create new channel
        return await this.create(new ChannelEntity(
          channelData.id,
          channelData.name,
          channelData.category,
          channelData.status,
          channelData.config,
          channelData.isEnabled,
          channelData.tenantId,
          new Date(),
          new Date()
        ));
      }
    } catch (error) {
      console.error('[CHANNEL-REPO] Error in createOrUpdate:', error);
      throw error;
    }
  }
}