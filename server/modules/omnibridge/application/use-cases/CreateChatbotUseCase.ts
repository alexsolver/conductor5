
import { IChatbotRepository } from '../../domain/repositories/IChatbotRepository';
import { ChatbotEntity } from '../../domain/entities/Chatbot';
import { v4 as uuidv4 } from 'uuid';

export interface CreateChatbotRequest {
  name: string;
  description?: string;
  channels: string[];
  workflow: any[];
  tenantId: string;
  aiConfig?: {
    model: string;
    instructions: string;
    temperature: number;
    maxTokens: number;
  };
  fallbackToHuman?: boolean;
}

export class CreateChatbotUseCase {
  constructor(private chatbotRepository: IChatbotRepository) {}

  async execute(request: CreateChatbotRequest) {
    console.log('🔧 [CreateChatbotUseCase] Creating chatbot:', request.name);

    const chatbot = new ChatbotEntity(
      uuidv4(),
      request.name,
      request.channels,
      request.workflow,
      request.tenantId,
      request.description,
      true, // isActive
      request.aiConfig,
      request.fallbackToHuman !== false
    );

    const savedChatbot = await this.chatbotRepository.create(chatbot);
    
    console.log('✅ [CreateChatbotUseCase] Chatbot created successfully:', savedChatbot.id);
    return savedChatbot;
  }
}
