
import { IChatbotRepository } from '../../domain/repositories/IChatbotRepository';
import { ChatbotEntity } from '../../domain/entities/Chatbot';
import { v4 as uuidv4 } from 'uuid';

export interface CreateChatbotRequest {
  name: string;
  description?: string;
  channels: string[];
  workflow: any[];
  steps?: any[]; // Support for both workflow and steps
  tenantId: string;
  greeting?: string;
  fallbackMessage?: string;
  transferToHuman?: boolean;
  aiConfig?: {
    model: string;
    instructions: string;
    temperature: number;
    maxTokens: number;
  };
  fallbackToHuman?: boolean;
  enabled?: boolean;
}

export class CreateChatbotUseCase {
  constructor(private chatbotRepository: IChatbotRepository) {}

  async execute(request: CreateChatbotRequest) {
    console.log('🔧 [CreateChatbotUseCase] Creating chatbot:', request.name);

    // Handle both workflow and steps format
    const workflowSteps = request.workflow || request.steps || [];
    
    // Convert simplified steps to workflow format if needed
    const normalizedWorkflow = workflowSteps.map((step: any) => {
      if (step.type && step.content) {
        return {
          id: step.id || uuidv4(),
          type: step.type === 'question' ? 'condition' : step.type === 'options' ? 'condition' : 'message',
          config: {
            message: step.content,
            title: step.title,
            options: step.options,
            actions: step.actions,
            nextStep: step.nextStep
          }
        };
      }
      return step;
    });

    const chatbot = new ChatbotEntity(
      uuidv4(),
      request.name,
      request.channels || ['whatsapp'],
      normalizedWorkflow,
      request.tenantId,
      request.description,
      request.enabled !== false, // Default to true unless explicitly disabled
      request.aiConfig,
      request.fallbackToHuman !== false && request.transferToHuman !== false
    );

    const savedChatbot = await this.chatbotRepository.create(chatbot);
    
    console.log('✅ [CreateChatbotUseCase] Chatbot created successfully:', savedChatbot.id);
    return savedChatbot;
  }
}
