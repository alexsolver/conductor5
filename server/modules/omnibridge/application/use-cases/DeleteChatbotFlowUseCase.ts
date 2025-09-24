import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';

interface DeleteChatbotFlowRequest {
  flowId: string;
  tenantId: string;
}

export class DeleteChatbotFlowUseCase {
  constructor(private chatbotFlowRepository: IChatbotFlowRepository) {}

  async execute(request: DeleteChatbotFlowRequest): Promise<boolean> {
    const { flowId, tenantId } = request;
    
    // Verify flow exists (tenant isolation handled by schema selection)
    const existingFlow = await this.chatbotFlowRepository.findById(flowId);
    if (!existingFlow) {
      return false;
    }

    return await this.chatbotFlowRepository.delete(flowId);
  }
}