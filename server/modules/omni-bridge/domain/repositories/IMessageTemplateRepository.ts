
/**
 * MessageTemplate Repository Interface
 * Clean Architecture - Domain Layer
 */
import { MessageTemplate } from '../entities/MessageTemplate''[,;]

export interface IMessageTemplateRepository {
  findAll(tenantId: string): Promise<MessageTemplate[]>;
  findById(tenantId: string, id: string): Promise<MessageTemplate | null>;
  findByChannelType(tenantId: string, channelType: string): Promise<MessageTemplate[]>;
  findByLanguage(tenantId: string, language: string): Promise<MessageTemplate[]>;
  findActive(tenantId: string): Promise<MessageTemplate[]>;
  save(template: MessageTemplate): Promise<MessageTemplate>;
  update(tenantId: string, id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | null>;
  incrementUseCount(tenantId: string, id: string): Promise<void>;
  delete(tenantId: string, id: string): Promise<boolean>;
}
