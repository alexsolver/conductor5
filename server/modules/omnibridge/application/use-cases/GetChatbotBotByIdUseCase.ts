import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { SelectChatbotBot } from '../../../../../shared/schema-chatbot';

interface GetChatbotBotByIdRequest {
  botId: string;
  tenantId: string;
}

export class GetChatbotBotByIdUseCase {
  constructor(private chatbotBotRepository: IChatbotBotRepository) {}

  async execute(request: GetChatbotBotByIdRequest): Promise<SelectChatbotBot | null> {
    const { botId, tenantId } = request;
    
    const bot = await this.chatbotBotRepository.findById(botId);
    
    // SECURITY: Verify bot belongs to tenant
    if (!bot || bot.tenantId !== tenantId) {
      return null;
    }

    return bot;
  }
}