
import { MessageEntity } from '../entities/Message';

export interface IMessageRepository {
  findById(id: string, tenantId: string): Promise<MessageEntity | null>;
  findByTenant(tenantId: string, limit?: number, offset?: number): Promise<MessageEntity[]>;
  findByChannel(channelId: string, tenantId: string): Promise<MessageEntity[]>;
  findByStatus(status: string, tenantId: string): Promise<MessageEntity[]>;
  findByPriority(priority: string, tenantId: string): Promise<MessageEntity[]>;
  create(message: MessageEntity): Promise<MessageEntity>;
  update(message: MessageEntity): Promise<MessageEntity>;
  delete(id: string, tenantId: string): Promise<boolean>;
  markAsRead(id: string, tenantId: string): Promise<boolean>;
  markAsProcessed(id: string, tenantId: string): Promise<boolean>;
  getUnreadCount(tenantId: string): Promise<number>;
  getStatsByChannel(tenantId: string): Promise<Array<{ channelId: string; count: number }>>;
}
