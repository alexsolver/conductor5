
import { IChatbotRepository } from '../../domain/repositories/IChatbotRepository';
import { Chatbot } from '../../domain/entities/Chatbot';

export interface UpdateChatbotRequest {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  channels?: string[];
  workflow?: any[];
  steps?: any[];
  isActive?: boolean;
  enabled?: boolean;
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
}

export class UpdateChatbotUseCase {
  constructor(private chatbotRepository: IChatbotRepository) {}

  async execute(request: UpdateChatbotRequest): Promise<Chatbot | null> {
    console.log('🔧 [UpdateChatbotUseCase] Updating chatbot:', request.id);

    // Handle both workflow and steps format
    let normalizedWorkflow = request.workflow;
    if (request.steps && !request.workflow) {
      normalizedWorkflow = request.steps.map((step: any) => {
        if (step.type && step.content) {
          return {
            id: step.id || step.id || `step_${Date.now()}`,
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
    }

    const updatedChatbot = await this.chatbotRepository.update(
      request.id,
      request.tenantId,
      {
        name: request.name,
        description: request.description,
        channels: request.channels,
        workflow: normalizedWorkflow,
        isActive: request.isActive !== undefined ? request.isActive : request.enabled,
        aiConfig: request.aiConfig,
        fallbackToHuman: request.fallbackToHuman !== undefined ? request.fallbackToHuman : request.transferToHuman
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
