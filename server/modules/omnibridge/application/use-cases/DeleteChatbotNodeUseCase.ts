import { IChatbotNodeRepository } from '../../domain/repositories/IChatbotNodeRepository';

interface DeleteChatbotNodeRequest {
  nodeId: string;
  tenantId: string;
}

export class DeleteChatbotNodeUseCase {
  constructor(private chatbotNodeRepository: IChatbotNodeRepository) {}

  async execute(request: DeleteChatbotNodeRequest): Promise<boolean> {
    const { nodeId, tenantId } = request;
    
    // Verify node exists and belongs to tenant
    const existingNode = await this.chatbotNodeRepository.findById(nodeId);
    if (!existingNode || existingNode.tenantId !== tenantId) {
      return false;
    }

    return await this.chatbotNodeRepository.delete(nodeId);
  }
}