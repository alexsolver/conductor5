// Repository Interface: IConversationMessageRepository
// Define o contrato para persistência de mensagens de conversa

import { ConversationMessage, CreateConversationMessageDTO } from '../entities/ConversationMessage';

export interface IConversationMessageRepository {
  // CRUD básico
  create(data: CreateConversationMessageDTO): Promise<ConversationMessage>;
  findById(id: number, tenantId: string): Promise<ConversationMessage | null>;
  delete(id: number, tenantId: string): Promise<void>;
  
  // Consultas por conversa
  findByConversationId(conversationId: number, tenantId: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'asc' | 'desc';
  }): Promise<{ messages: ConversationMessage[]; total: number }>;
  
  // Busca full-text
  search(tenantId: string, searchTerm: string, options?: {
    agentId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: ConversationMessage[]; total: number }>;
  
  // Incrementar contador de mensagens na conversa
  incrementConversationMessageCount(conversationId: number, tenantId: string): Promise<void>;
}
