import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { InsertChatbotFlow, SelectChatbotFlow } from '../../../../../shared/schema-chatbot';

export interface CreateChatbotFlowRequest {
  tenantId: string; // For validation, not for database insert
  botId: string;
  id?: string; // Optional custom ID
  name: string;
  description?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
}

export class CreateChatbotFlowUseCase {
  constructor(
    private chatbotFlowRepository: IChatbotFlowRepository,
    private chatbotBotRepository: IChatbotBotRepository
  ) {}

  async execute(request: CreateChatbotFlowRequest & { id?: string }): Promise<SelectChatbotFlow> {
    const { botId, tenantId, id, ...flowData } = request;

    console.log('🔧 [USE-CASE] Creating flow:', { botId, tenantId, id, flowData });

    // Verify bot belongs to tenant
    const bot = await this.chatbotBotRepository.findById(botId, tenantId);
    if (!bot) {
      throw new Error('Bot not found or access denied');
    }

    console.log('✅ [USE-CASE] Bot verified:', { botId: bot.id, botName: bot.name });

    const flowToCreate = {
      botId,
      ...flowData
    };

    // Include custom ID if provided
    if (id) {
      (flowToCreate as any).id = id;
      console.log('🆔 [USE-CASE] Using custom flow ID:', id);
    }

    const flow = await this.chatbotFlowRepository.create(flowToCreate);
    console.log('✅ [USE-CASE] Flow created successfully:', flow.id);

    return flow;
  }
}