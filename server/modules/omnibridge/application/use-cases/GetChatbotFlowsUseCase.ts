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
      const bot = await this.chatbotBotRepository.findById(botId, tenantId);
      if (!bot || bot.tenantId !== tenantId) {
        throw new Error('Bot not found or access denied');
      }
      
      return await this.chatbotFlowRepository.findByBot(botId);
    }
    
    // If no botId provided, get all flows for all bots in tenant
    const bots = await this.chatbotBotRepository.findByTenant(tenantId);
    const allFlows: SelectChatbotFlow[] = [];
    
    for (const bot of bots) {
      const flows = await this.chatbotFlowRepository.findByBot(bot.id);
      allFlows.push(...flows);
    }
    
    return allFlows;
  }
}