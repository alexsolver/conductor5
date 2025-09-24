import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { SelectChatbotBot } from '../../../../../shared/schema-chatbot';

interface ToggleChatbotBotRequest {
  botId: string;
  tenantId: string;
}

export class ToggleChatbotBotUseCase {
  constructor(private chatbotBotRepository: IChatbotBotRepository) {}

  async execute(request: ToggleChatbotBotRequest): Promise<SelectChatbotBot> {
    const { botId, tenantId } = request;
    
    // Get current bot state
    const existingBot = await this.chatbotBotRepository.findById(botId, tenantId);
    if (!existingBot || existingBot.tenantId !== tenantId) {
      throw new Error('Bot not found');
    }

    // Toggle the isEnabled state
    const updatedBot = await this.chatbotBotRepository.update(botId, tenantId, {
      isEnabled: !existingBot.isEnabled
    });

    if (!updatedBot) {
      throw new Error('Failed to toggle bot state');
    }

    return updatedBot;
  }
}