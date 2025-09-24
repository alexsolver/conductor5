import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';

interface DeleteChatbotBotRequest {
  botId: string;
  tenantId: string;
}

export class DeleteChatbotBotUseCase {
  constructor(private chatbotBotRepository: IChatbotBotRepository) {}

  async execute({ botId, tenantId }: { botId: string; tenantId: string }): Promise<boolean> {
    console.log('🗑️ [DeleteChatbotBotUseCase] Deleting bot:', { botId, tenantId });

    try {
      // Verify bot exists and belongs to tenant
      const existingBot = await this.chatbotBotRepository.findById(botId, tenantId);
      if (!existingBot) {
        console.log('❌ [DeleteChatbotBotUseCase] Bot not found or access denied:', { botId, tenantId });
        return false;
      }

      console.log('🔧 [DeleteChatbotBotUseCase] Bot found, proceeding with deletion:', existingBot.name);

      // Delete the bot
      const success = await this.chatbotBotRepository.delete(botId, tenantId);

      if (success) {
        console.log('✅ [DeleteChatbotBotUseCase] Bot deleted successfully:', { botId, name: existingBot.name });
      } else {
        console.log('❌ [DeleteChatbotBotUseCase] Failed to delete bot:', botId);
      }

      return success;
    } catch (error) {
      console.error('❌ [DeleteChatbotBotUseCase] Error during deletion:', error);
      throw error;
    }
  }
}