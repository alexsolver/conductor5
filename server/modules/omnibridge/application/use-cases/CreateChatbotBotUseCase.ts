import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { InsertChatbotBot, SelectChatbotBot } from '../../../../../shared/schema-chatbot';

export interface CreateChatbotBotRequest {
  tenantId: string;
  name: string;
  description?: string;
  defaultLanguage?: string;
  fallbackToHuman?: boolean;
  timeout?: number;
  maxRetries?: number;
}

export class CreateChatbotBotUseCase {
  constructor(private botRepository: IChatbotBotRepository) {}

  async execute(request: CreateChatbotBotRequest): Promise<SelectChatbotBot> {
    const botData: InsertChatbotBot = {
      tenantId: request.tenantId,
      name: request.name,
      description: request.description || null,
      isEnabled: true,
      defaultLanguage: request.defaultLanguage || 'pt-BR',
      fallbackToHuman: request.fallbackToHuman ?? true,
      timeout: request.timeout || 300,
      maxRetries: request.maxRetries || 3
    };

    const bot = await this.botRepository.create(botData);
    return bot;
  }
}