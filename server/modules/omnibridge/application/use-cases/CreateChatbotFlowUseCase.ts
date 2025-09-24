import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { InsertChatbotFlow, SelectChatbotFlow } from '../../../../../shared/schema-chatbot';

export interface CreateChatbotFlowRequest {
  tenantId: string;
  botId: string;
  name: string;
  description?: string;
  settings?: any;
  isActive?: boolean;
}

export class CreateChatbotFlowUseCase {
  constructor(
    private chatbotFlowRepository: IChatbotFlowRepository,
    private chatbotBotRepository: IChatbotBotRepository
  ) {}

  async execute(request: CreateChatbotFlowRequest & { id?: string }): Promise<SelectChatbotFlow> {
    const { botId, tenantId, id, ...flowData } = request;

    // Verify bot belongs to tenant
    const bot = await this.chatbotBotRepository.findById(botId, tenantId);
    if (!bot) {
      throw new Error('Bot not found or access denied');
    }

    const flowToCreate = {
      botId,
      ...flowData
    };

    // Include custom ID if provided
    if (id) {
      (flowToCreate as any).id = id;
    }

    const flow = await this.chatbotFlowRepository.create(flowToCreate);

    return flow;
  }
}