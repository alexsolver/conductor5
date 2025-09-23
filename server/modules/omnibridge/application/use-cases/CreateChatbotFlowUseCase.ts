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
    private flowRepository: IChatbotFlowRepository,
    private botRepository: IChatbotBotRepository
  ) {}

  async execute(request: CreateChatbotFlowRequest): Promise<SelectChatbotFlow> {
    // Validate bot exists and belongs to tenant
    const bot = await this.botRepository.findById(request.botId, request.tenantId);
    if (!bot) {
      throw new Error('Bot not found or does not belong to tenant');
    }

    // Get next version number for this bot
    const latestFlow = await this.flowRepository.getLatestVersion(request.botId);
    const nextVersion = latestFlow ? latestFlow.version + 1 : 1;

    const flowData: InsertChatbotFlow = {
      botId: request.botId,
      name: request.name,
      version: nextVersion,
      description: request.description || null,
      settings: request.settings || {},
      isActive: request.isActive || false
    };

    const flow = await this.flowRepository.create(flowData);

    // If this should be active, activate it (deactivating others)
    if (request.isActive) {
      await this.flowRepository.activateVersion(flow.id);
    }

    return flow;
  }
}