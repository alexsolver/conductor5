import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { SelectChatbotFlow } from '../../../../../shared/schema-chatbot';

interface GetChatbotFlowsRequest {
  botId: string;
  tenantId: string;
}

export class GetChatbotFlowsUseCase {
  constructor(
    private chatbotFlowRepository: IChatbotFlowRepository,
    private chatbotBotRepository: IChatbotBotRepository
  ) {}

  async execute(request: GetChatbotFlowsRequest): Promise<SelectChatbotFlow[]> {
    const { botId, tenantId } = request;
    
    if (botId) {
      // SECURITY: Verify bot belongs to tenant before getting flows
      const bot = await this.chatbotBotRepository.findById(botId);
      if (!bot || bot.tenantId !== tenantId) {
        throw new Error('Bot not found or access denied');
      }
      
      return await this.chatbotFlowRepository.findByBot(botId);
    }
    
    // If no botId provided, get all flows for tenant
    return await this.chatbotFlowRepository.findByTenant(tenantId);
  }
}