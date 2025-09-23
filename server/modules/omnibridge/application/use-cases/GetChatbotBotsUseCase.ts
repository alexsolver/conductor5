import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { SelectChatbotBot, ChatbotBotWithFlows } from '../../../../../shared/schema-chatbot';

export interface GetChatbotBotsRequest {
  tenantId: string;
  includeDisabled?: boolean;
  includeFlows?: boolean;
}

export class GetChatbotBotsUseCase {
  constructor(private botRepository: IChatbotBotRepository) {}

  async execute(request: GetChatbotBotsRequest): Promise<SelectChatbotBot[] | ChatbotBotWithFlows[]> {
    if (request.includeFlows) {
      if (request.includeDisabled) {
        const bots = await this.botRepository.findByTenant(request.tenantId);
        return await Promise.all(
          bots.map(async (bot) => {
            const botWithFlows = await this.botRepository.findWithFlows(bot.id, request.tenantId);
            return botWithFlows!;
          })
        );
      } else {
        return await this.botRepository.findBotsWithActiveFlows(request.tenantId);
      }
    } else {
      if (request.includeDisabled) {
        return await this.botRepository.findByTenant(request.tenantId);
      } else {
        return await this.botRepository.findActiveByTenant(request.tenantId);
      }
    }
  }
}