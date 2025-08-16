
import { IChatbotRepository } from '../../domain/repositories/IChatbotRepository';

export class GetChatbotsUseCase {
  constructor(private chatbotRepository: IChatbotRepository) {}

  async execute(tenantId: string) {
    console.log('🔍 [GetChatbotsUseCase] Getting chatbots for tenant:', tenantId);
    
    const chatbots = await this.chatbotRepository.findByTenant(tenantId);
    
    console.log(`✅ [GetChatbotsUseCase] Retrieved ${chatbots.length} chatbots`);
    return chatbots;
  }
}
