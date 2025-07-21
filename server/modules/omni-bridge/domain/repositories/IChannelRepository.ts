
/**
 * Channel Repository Interface
 * Clean Architecture - Domain Layer
 */
import { Channel } from '../entities/Channel''[,;]

export interface IChannelRepository {
  findAll(tenantId: string): Promise<Channel[]>;
  findById(tenantId: string, id: string): Promise<Channel | null>;
  findByType(tenantId: string, type: string): Promise<Channel[]>;
  findActive(tenantId: string): Promise<Channel[]>;
  save(channel: Channel): Promise<Channel>;
  update(tenantId: string, id: string, updates: Partial<Channel>): Promise<Channel | null>;
  updateStatus(tenantId: string, id: string, isConnected: boolean, errorMessage?: string): Promise<void>;
  incrementMessageCount(tenantId: string, id: string): Promise<void>;
  delete(tenantId: string, id: string): Promise<boolean>;
}
