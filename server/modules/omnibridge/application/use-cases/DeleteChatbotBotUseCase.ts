import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';

interface DeleteChatbotBotRequest {
  botId: string;
  tenantId: string;
}

export class DeleteChatbotBotUseCase {
  constructor(private chatbotBotRepository: IChatbotBotRepository) {}

  async execute(request: DeleteChatbotBotRequest): Promise<boolean> {
    const { botId, tenantId } = request;
    
    // Verify bot exists and belongs to tenant
    const existingBot = await this.chatbotBotRepository.findById(botId);
    if (!existingBot || existingBot.tenantId !== tenantId) {
      return false;
    }

    return await this.chatbotBotRepository.delete(botId);
  }
}