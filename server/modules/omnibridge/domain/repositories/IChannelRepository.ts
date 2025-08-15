
import { ChannelEntity } from '../entities/Channel';

export interface IChannelRepository {
  findById(id: string, tenantId: string): Promise<ChannelEntity | null>;
  findByTenant(tenantId: string): Promise<ChannelEntity[]>;
  findActiveByTenant(tenantId: string): Promise<ChannelEntity[]>;
  findByType(type: string, tenantId: string): Promise<ChannelEntity[]>;
  create(channel: ChannelEntity): Promise<ChannelEntity>;
  update(channel: ChannelEntity): Promise<ChannelEntity>;
  delete(id: string, tenantId: string): Promise<boolean>;
  toggleStatus(id: string, tenantId: string, isEnabled: boolean): Promise<boolean>;
}
