import { IChatbotNodeRepository } from '../../domain/repositories/IChatbotNodeRepository';

interface DeleteChatbotNodeRequest {
  nodeId: string;
  tenantId: string;
}

export class DeleteChatbotNodeUseCase {
  constructor(private chatbotNodeRepository: IChatbotNodeRepository) {}

  async execute(request: DeleteChatbotNodeRequest): Promise<boolean> {
    const { nodeId, tenantId } = request;
    
    // Verify node exists (tenant isolation handled by schema selection)
    const existingNode = await this.chatbotNodeRepository.findById(nodeId);
    if (!existingNode) {
      return false;
    }

    return await this.chatbotNodeRepository.delete(nodeId);
  }
}