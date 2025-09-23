import { IChatbotBotRepository } from '../../domain/repositories/IChatbotBotRepository';
import { IChatbotFlowRepository } from '../../domain/repositories/IChatbotFlowRepository';
import { IChatbotNodeRepository } from '../../domain/repositories/IChatbotNodeRepository';
import { IChatbotEdgeRepository } from '../../domain/repositories/IChatbotEdgeRepository';
import { IChatbotExecutionRepository } from '../../domain/repositories/IChatbotExecutionRepository';
import { ChatbotExecutionEngine } from '../engines/ChatbotExecutionEngine';
import { 
  SelectChatbotBot,
  SelectChatbotExecution,
  InsertChatbotExecution
} from '../../../../../shared/schema-chatbot';

export interface ProcessMessageRequest {
  tenantId: string;
  channelId: string;
  messageId: string;
  content: string;
  userId?: string;
  userContext?: any;
  metadata?: any;
}

export interface ProcessMessageResponse {
  success: boolean;
  executionId?: string;
  responses: ChatbotResponse[];
  fallbackToHuman?: boolean;
  error?: string;
}

export interface ChatbotResponse {
  type: 'text' | 'media' | 'form' | 'action';
  content: any;
  nodeId: string;
  timestamp: Date;
}

export class ProcessChatbotMessageUseCase {
  private executionEngine: ChatbotExecutionEngine;

  constructor(
    private botRepository: IChatbotBotRepository,
    private flowRepository: IChatbotFlowRepository,
    private nodeRepository: IChatbotNodeRepository,
    private edgeRepository: IChatbotEdgeRepository,
    private executionRepository: IChatbotExecutionRepository
  ) {
    this.executionEngine = new ChatbotExecutionEngine(
      nodeRepository,
      edgeRepository,
      executionRepository
    );
  }

  async execute(request: ProcessMessageRequest): Promise<ProcessMessageResponse> {
    try {
      // Step 1: Find appropriate bots for the channel
      const bots = await this.botRepository.findByChannel(request.channelId, request.tenantId);
      
      if (bots.length === 0) {
        return {
          success: false,
          responses: [],
          fallbackToHuman: true,
          error: 'No chatbots configured for this channel'
        };
      }

      // Step 2: Select the highest priority enabled bot
      const enabledBots = bots.filter(bot => bot.isEnabled);
      if (enabledBots.length === 0) {
        return {
          success: false,
          responses: [],
          fallbackToHuman: true,
          error: 'No enabled chatbots found for this channel'
        };
      }
      
      // Select the first enabled bot (they're already ordered by priority from repository)
      const selectedBot = enabledBots[0];

      // Step 3: Get the bot's flows
      const flows = await this.flowRepository.findByBot(selectedBot.id);
      if (flows.length === 0) {
        return {
          success: false,
          responses: [],
          fallbackToHuman: selectedBot.fallbackToHuman,
          error: 'No flows configured for chatbot'
        };
      }

      // Step 4: Find appropriate flow to execute
      // For now, we'll use the first active flow, but this could be enhanced
      // with trigger matching logic in the future
      const activeFlow = flows.find(flow => flow.isActive);
      if (!activeFlow) {
        return {
          success: false,
          responses: [],
          fallbackToHuman: selectedBot.fallbackToHuman,
          error: 'No active flows found for chatbot'
        };
      }

      // Step 5: Create execution record
      const executionData: InsertChatbotExecution = {
        tenantId: request.tenantId,
        botId: selectedBot.id,
        flowId: activeFlow.id,
        channelId: request.channelId,
        messageId: request.messageId,
        userId: request.userId,
        status: 'running',
        context: {
          userInput: request.content,
          userContext: request.userContext || {},
          metadata: request.metadata || {},
          variables: {}
        },
        nodeTrace: [],
        metrics: {}
      };

      const execution = await this.executionRepository.startExecution(executionData);

      // Step 6: Execute the flow
      const executionResult = await this.executionEngine.executeFlow({
        execution,
        userInput: request.content,
        context: executionData.context
      });

      // Step 7: Update execution status and persist final context/metrics
      await this.executionRepository.updateStatus(
        execution.id,
        executionResult.success ? 'completed' : 'failed',
        executionResult.error
      );

      // Persist final context and metrics if available
      if (executionResult.finalContext) {
        await this.executionRepository.updateContext(execution.id, executionResult.finalContext);
      }

      // Step 8: Return response
      return {
        success: executionResult.success,
        executionId: execution.id,
        responses: executionResult.responses,
        fallbackToHuman: executionResult.fallbackToHuman || selectedBot.fallbackToHuman,
        error: executionResult.error
      };

    } catch (error) {
      console.error('Error processing chatbot message:', error);
      return {
        success: false,
        responses: [],
        fallbackToHuman: true,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getExecution(executionId: string): Promise<SelectChatbotExecution | null> {
    return await this.executionRepository.findById(executionId);
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    return await this.executionRepository.updateStatus(executionId, 'cancelled');
  }

  async getActiveExecutions(tenantId: string): Promise<SelectChatbotExecution[]> {
    return await this.executionRepository.findActiveExecutions(tenantId);
  }

  async handleTimeout(executionId: string): Promise<boolean> {
    return await this.executionRepository.updateStatus(executionId, 'timeout', 'Execution timed out');
  }
}