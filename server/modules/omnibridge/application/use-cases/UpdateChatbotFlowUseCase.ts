import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { SelectChatbotFlow, InsertChatbotFlow } from '../../../../../shared/schema-chatbot';

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
  constructor(private chatbotFlowRepository: IChatbotFlowRepository) {}

  async execute(request: UpdateChatbotFlowRequest): Promise<SelectChatbotFlow> {
    const { flowId, tenantId, ...updateData } = request;
    
    // Verify flow exists and belongs to tenant
    const existingFlow = await this.chatbotFlowRepository.findById(flowId);
    if (!existingFlow || existingFlow.tenantId !== tenantId) {
      throw new Error('Flow not found');
    }

    const updatedFlow = await this.chatbotFlowRepository.update(flowId, updateData);
    
    if (!updatedFlow) {
      throw new Error('Failed to update flow');
    }

    return updatedFlow;
  }
}