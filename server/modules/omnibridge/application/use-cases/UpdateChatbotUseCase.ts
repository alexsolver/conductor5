
import { IChatbotRepository } from '../../domain/repositories/IChatbotRepository';
import { Chatbot } from '../../domain/entities/Chatbot';

export interface UpdateChatbotRequest {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  channels?: string[];
  workflow?: any[];
  isActive?: boolean;
  aiConfig?: {
    model: string;
    instructions: string;
    temperature: number;
    maxTokens: number;
  };
  fallbackToHuman?: boolean;
}

export class UpdateChatbotUseCase {
  constructor(private chatbotRepository: IChatbotRepository) {}

  async execute(request: UpdateChatbotRequest): Promise<Chatbot | null> {
    console.log('🔧 [UpdateChatbotUseCase] Updating chatbot:', request.id);

    const updatedChatbot = await this.chatbotRepository.update(
      request.id,
      request.tenantId,
      {
        name: request.name,
        description: request.description,
        channels: request.channels,
        workflow: request.workflow,
        isActive: request.isActive,
        aiConfig: request.aiConfig,
        fallbackToHuman: request.fallbackToHuman
      }
    );

    if (updatedChatbot) {
      console.log('✅ [UpdateChatbotUseCase] Chatbot updated successfully');
    } else {
      console.log('❌ [UpdateChatbotUseCase] Chatbot not found');
    }

    return updatedChatbot;
  }
}
