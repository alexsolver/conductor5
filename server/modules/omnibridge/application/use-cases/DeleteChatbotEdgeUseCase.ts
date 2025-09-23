import { IChatbotEdgeRepository } from '../../domain/repositories/IChatbotEdgeRepository';

interface DeleteChatbotEdgeRequest {
  edgeId: string;
  tenantId: string;
}

export class DeleteChatbotEdgeUseCase {
  constructor(private chatbotEdgeRepository: IChatbotEdgeRepository) {}

  async execute(request: DeleteChatbotEdgeRequest): Promise<boolean> {
    const { edgeId, tenantId } = request;
    
    // Verify edge exists and belongs to tenant
    const existingEdge = await this.chatbotEdgeRepository.findById(edgeId);
    if (!existingEdge || existingEdge.tenantId !== tenantId) {
      return false;
    }

    return await this.chatbotEdgeRepository.delete(edgeId);
  }
}