import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { SelectChatbotFlow, UpdateChatbotFlow } from '../../../../../shared/schema-chatbot';

interface UpdateChatbotFlowRequest {
  flowId: string;
  tenantId: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class UpdateChatbotFlowUseCase {
  public chatbotFlowRepository: IChatbotFlowRepository;

  constructor(
    chatbotFlowRepository: IChatbotFlowRepository,
    private chatbotBotRepository: IChatbotBotRepository
  ) {
    this.chatbotFlowRepository = chatbotFlowRepository;
  }

  async execute(request: UpdateChatbotFlowRequest): Promise<SelectChatbotFlow> {
    const { flowId, tenantId, ...updateData } = request;

    // Verify flow exists
    const existingFlow = await this.chatbotFlowRepository.findById(flowId, tenantId);
    if (!existingFlow) {
      throw new Error('Flow not found');
    }

    // Verify bot belongs to tenant
    const bot = await this.chatbotBotRepository.findById(existingFlow.botId, tenantId);
    if (!bot) {
      throw new Error('Flow not found or access denied');
    }

    const updatedFlow = await this.chatbotFlowRepository.update(flowId, updateData);

    if (!updatedFlow) {
      throw new Error('Failed to update flow');
    }

    return updatedFlow;
  }
}