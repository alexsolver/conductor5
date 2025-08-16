
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
import { Chatbot } from '../entities/Chatbot';

export interface IChatbotRepository {
  create(chatbot: Chatbot): Promise<Chatbot>;
  findById(id: string, tenantId: string): Promise<Chatbot | null>;
  findByTenant(tenantId: string): Promise<Chatbot[]>;
  update(id: string, tenantId: string, updates: Partial<Chatbot>): Promise<Chatbot | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
