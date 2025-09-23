import { IChatbotEdgeRepository } from '../../domain/repositories/IChatbotEdgeRepository';
import { SelectChatbotEdge, InsertChatbotEdge } from '../../../../../shared/schema-chatbot';

export class CreateChatbotEdgeUseCase {
  constructor(private chatbotEdgeRepository: IChatbotEdgeRepository) {}

  async execute(data: InsertChatbotEdge): Promise<SelectChatbotEdge> {
    const edge = await this.chatbotEdgeRepository.create(data);
    
    if (!edge) {
      throw new Error('Failed to create chatbot edge');
    }

    return edge;
  }
}