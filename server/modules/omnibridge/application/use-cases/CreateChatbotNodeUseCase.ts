import { IChatbotNodeRepository } from '../../domain/repositories/IChatbotNodeRepository';
import { SelectChatbotNode, InsertChatbotNode } from '../../../../../shared/schema-chatbot';

export class CreateChatbotNodeUseCase {
  constructor(private chatbotNodeRepository: IChatbotNodeRepository) {}

  async execute(data: InsertChatbotNode): Promise<SelectChatbotNode> {
    const node = await this.chatbotNodeRepository.create(data);
    
    if (!node) {
      throw new Error('Failed to create chatbot node');
    }

    return node;
  }
}