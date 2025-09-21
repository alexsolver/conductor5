
import { Chatbot } from '../entities/Chatbot';

export interface IChatbotRepository {
  create(chatbot: Chatbot): Promise<Chatbot>;
  findById(id: string, tenantId: string): Promise<Chatbot | null>;
  findByTenant(tenantId: string): Promise<Chatbot[]>;
  findActiveByTenant(tenantId: string): Promise<Chatbot[]>;
  findByChannel(channelId: string, tenantId: string): Promise<Chatbot[]>;
  update(id: string, tenantId: string, updates: Partial<Chatbot>): Promise<Chatbot | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  toggleStatus(id: string, tenantId: string, isActive: boolean): Promise<boolean>;
}
