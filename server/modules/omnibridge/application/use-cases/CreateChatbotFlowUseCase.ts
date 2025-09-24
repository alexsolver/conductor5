import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { InsertChatbotFlow, SelectChatbotFlow } from '../../../../../shared/schema-chatbot';

export interface CreateChatbotFlowRequest {
  tenantId: string;
  botId: string;
  name: string;
  description?: string;
  isActive?: boolean;
  nodes?: any[];
  edges?: any[];
  variables?: any[];
}

export class CreateChatbotFlowUseCase {
  constructor(
    private chatbotFlowRepository: IChatbotFlowRepository,
    private chatbotBotRepository: IChatbotBotRepository
  ) {}

  async execute(request: CreateChatbotFlowRequest): Promise<SelectChatbotFlow> {
    const { tenantId, botId, name, description, isActive = false, nodes = [], edges = [], variables = [] } = request;

    console.log('🔄 [USE-CASE] CreateChatbotFlow executing with:', { tenantId, botId, name, description, isActive });

    // Verify bot exists and belongs to tenant
    const bot = await this.chatbotBotRepository.findById(botId, tenantId);
    if (!bot) {
      console.log('❌ [USE-CASE] Bot not found:', { botId, tenantId });
      throw new Error('Bot not found or access denied');
    }

    console.log('✅ [USE-CASE] Bot verified:', { botId: bot.id, botName: bot.name });

    const flowData: InsertChatbotFlow & { tenantId: string } = {
      botId,
      name,
      description,
      nodes,
      edges,
      variables,
      isActive,
      tenantId // Pass tenantId for repository to use correct schema
    };

    console.log('🔧 [USE-CASE] Creating flow with data:', flowData);

    const flow = await this.chatbotFlowRepository.create(flowData);

    console.log('✅ [USE-CASE] Flow created successfully:', { flowId: flow.id, flowName: flow.name });

    return flow;
  }
}