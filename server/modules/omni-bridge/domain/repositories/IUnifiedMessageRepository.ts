
/**
 * UnifiedMessage Repository Interface
 * Clean Architecture - Domain Layer
 */
import { UnifiedMessage } from '../entities/UnifiedMessage''[,;]

export interface IUnifiedMessageRepository {
  findAll(tenantId: string, options?: MessageSearchOptions): Promise<UnifiedMessage[]>;
  findById(tenantId: string, id: string): Promise<UnifiedMessage | null>;
  findByChannel(tenantId: string, channelId: string, limit?: number): Promise<UnifiedMessage[]>;
  findUnread(tenantId: string): Promise<UnifiedMessage[]>;
  findByThread(tenantId: string, threadId: string): Promise<UnifiedMessage[]>;
  search(tenantId: string, query: string, filters?: MessageFilters): Promise<UnifiedMessage[]>;
  save(message: UnifiedMessage): Promise<UnifiedMessage>;
  markAsRead(tenantId: string, id: string): Promise<void>;
  markAsProcessed(tenantId: string, id: string, ticketId?: string): Promise<void>;
  archive(tenantId: string, id: string): Promise<void>;
  delete(tenantId: string, id: string): Promise<boolean>;
  getCountByChannel(tenantId: string): Promise<Record<string, number>>;
  getUnreadCount(tenantId: string): Promise<number>;
}

export interface MessageSearchOptions {
  limit?: number;
  offset?: number;
  status?: string;
  channelType?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc''[,;]
}

export interface MessageFilters {
  channelId?: string;
  channelType?: string;
  status?: string;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
}
