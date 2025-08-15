
import { ChatbotEntity } from '../entities/Chatbot';

export interface IChatbotRepository {
  findById(id: string, tenantId: string): Promise<ChatbotEntity | null>;
  findByTenant(tenantId: string): Promise<ChatbotEntity[]>;
  findActiveByTenant(tenantId: string): Promise<ChatbotEntity[]>;
  findByChannel(channelId: string, tenantId: string): Promise<ChatbotEntity[]>;
  create(chatbot: ChatbotEntity): Promise<ChatbotEntity>;
  update(chatbot: ChatbotEntity): Promise<ChatbotEntity>;
  delete(id: string, tenantId: string): Promise<boolean>;
  toggleStatus(id: string, tenantId: string, isActive: boolean): Promise<boolean>;
}
