import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';

interface DeleteChatbotFlowRequest {
  flowId: string;
  tenantId: string;
}

export class DeleteChatbotFlowUseCase {
  constructor(private chatbotFlowRepository: IChatbotFlowRepository) {}

  async execute(request: DeleteChatbotFlowRequest): Promise<boolean> {
    const { flowId, tenantId } = request;
    
    // Verify flow exists and belongs to tenant
    const existingFlow = await this.chatbotFlowRepository.findById(flowId);
    if (!existingFlow || existingFlow.tenantId !== tenantId) {
      return false;
    }

    return await this.chatbotFlowRepository.delete(flowId);
  }
}