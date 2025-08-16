
import { IChatbotRepository } from '../../domain/repositories/IChatbotRepository';

export class DeleteChatbotUseCase {
  constructor(private chatbotRepository: IChatbotRepository) {}

  async execute(id: string, tenantId: string): Promise<boolean> {
    console.log('🗑️ [DeleteChatbotUseCase] Deleting chatbot:', id);

    const success = await this.chatbotRepository.delete(id, tenantId);
    
    if (success) {
      console.log('✅ [DeleteChatbotUseCase] Chatbot deleted successfully');
    } else {
      console.log('❌ [DeleteChatbotUseCase] Chatbot not found');
    }

    return success;
  }
}
