import { IChatbotNodeRepository } from '../../domain/repositories/IChatbotNodeRepository';
import { SelectChatbotNode } from '../../../../../shared/schema-chatbot';

interface UpdateChatbotNodeRequest {
  nodeId: string;
  tenantId: string;
  name?: string;
  type?: string;
  category?: string;
  configuration?: Record<string, any>;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export class UpdateChatbotNodeUseCase {
  constructor(private chatbotNodeRepository: IChatbotNodeRepository) {}

  async execute(request: UpdateChatbotNodeRequest): Promise<SelectChatbotNode> {
    const { nodeId, tenantId, ...updateData } = request;
    
    // Verify node exists (tenant isolation handled by schema selection)
    const existingNode = await this.chatbotNodeRepository.findById(nodeId);
    if (!existingNode) {
      throw new Error('Node not found');
    }

    const updatedNode = await this.chatbotNodeRepository.update(nodeId, updateData);
    
    if (!updatedNode) {
      throw new Error('Failed to update node');
    }

    return updatedNode;
  }
}