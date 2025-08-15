
import { db } from '../../../../db';
import { schema } from '../../../../shared/schema';
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
    throw new Error('Channels should be created via Workspace Admin');
  }

  async update(channel: ChannelEntity): Promise<ChannelEntity> {
    // Apenas status pode ser alterado no OmniBridge
    await db
      .update(schema.serviceIntegrations)
      .set({
        enabled: channel.isEnabled,
        status: channel.status,
        updatedAt: channel.updatedAt
      })
      .where(
        and(
          eq(schema.serviceIntegrations.id, channel.id),
          eq(schema.serviceIntegrations.tenantId, channel.tenantId)
        )
      );

    return channel;
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
}
