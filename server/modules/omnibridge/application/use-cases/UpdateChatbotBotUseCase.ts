import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { UpdateChatbotBot, SelectChatbotBot } from '../../../../../shared/schema-chatbot';

export interface UpdateChatbotBotRequest {
  botId: string;
  tenantId: string;
  updates: {
    name?: string;
    description?: string;
    isEnabled?: boolean;
    defaultLanguage?: string;
    fallbackToHuman?: boolean;
    timeout?: number;
    maxRetries?: number;
  };
}

export class UpdateChatbotBotUseCase {
  constructor(private botRepository: IChatbotBotRepository) {}

  async execute(request: UpdateChatbotBotRequest): Promise<SelectChatbotBot | null> {
    // Validate bot exists and belongs to tenant
    const existingBot = await this.botRepository.findById(request.botId, request.tenantId);
    if (!existingBot) {
      throw new Error('Bot not found or does not belong to tenant');
    }

    const updateData: UpdateChatbotBot = {
      ...request.updates
    };

    return await this.botRepository.update(request.botId, request.tenantId, updateData);
  }
}