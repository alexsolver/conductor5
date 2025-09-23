import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  insertChatbotBotSchema, 
  updateChatbotBotSchema,
  insertChatbotFlowSchema,
  updateChatbotFlowSchema,
  insertChatbotNodeSchema,
  updateChatbotNodeSchema,
  insertChatbotEdgeSchema,
  updateChatbotEdgeSchema
} from '../../../../../shared/schema-chatbot';

// Use cases
import { CreateChatbotBotUseCase } from '../use-cases/CreateChatbotBotUseCase';
import { GetChatbotBotsUseCase } from '../use-cases/GetChatbotBotsUseCase';
import { GetChatbotBotByIdUseCase } from '../use-cases/GetChatbotBotByIdUseCase';
import { UpdateChatbotBotUseCase } from '../use-cases/UpdateChatbotBotUseCase';
import { DeleteChatbotBotUseCase } from '../use-cases/DeleteChatbotBotUseCase';
import { ToggleChatbotBotUseCase } from '../use-cases/ToggleChatbotBotUseCase';
import { CreateChatbotFlowUseCase } from '../use-cases/CreateChatbotFlowUseCase';
import { GetChatbotFlowsUseCase } from '../use-cases/GetChatbotFlowsUseCase';
import { GetChatbotFlowByIdUseCase } from '../use-cases/GetChatbotFlowByIdUseCase';
import { UpdateChatbotFlowUseCase } from '../use-cases/UpdateChatbotFlowUseCase';
import { DeleteChatbotFlowUseCase } from '../use-cases/DeleteChatbotFlowUseCase';
import { CreateChatbotNodeUseCase } from '../use-cases/CreateChatbotNodeUseCase';
import { UpdateChatbotNodeUseCase } from '../use-cases/UpdateChatbotNodeUseCase';
import { DeleteChatbotNodeUseCase } from '../use-cases/DeleteChatbotNodeUseCase';
import { CreateChatbotEdgeUseCase } from '../use-cases/CreateChatbotEdgeUseCase';
import { DeleteChatbotEdgeUseCase } from '../use-cases/DeleteChatbotEdgeUseCase';
import { ProcessChatbotMessageUseCase } from '../use-cases/ProcessChatbotMessageUseCase';

// Request schemas for message processing
const processMessageSchema = z.object({
  botId: z.string().optional(), // If not provided, will auto-select best bot
  channelId: z.string(),
  messageId: z.string(),
  userId: z.string().optional(),
  content: z.string(),
  userContext: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    roles: string[];
    permissions: any[];
    attributes: Record<string, any>;
  };
}

export class ChatbotController {
  constructor(
    private createBotUseCase: CreateChatbotBotUseCase,
    private getBotsUseCase: GetChatbotBotsUseCase,
    private getBotByIdUseCase: GetChatbotBotByIdUseCase,
    private updateBotUseCase: UpdateChatbotBotUseCase,
    private deleteBotUseCase: DeleteChatbotBotUseCase,
    private toggleBotUseCase: ToggleChatbotBotUseCase,
    private createFlowUseCase: CreateChatbotFlowUseCase,
    private getFlowsUseCase: GetChatbotFlowsUseCase,
    private getFlowByIdUseCase: GetChatbotFlowByIdUseCase,
    private updateFlowUseCase: UpdateChatbotFlowUseCase,
    private deleteFlowUseCase: DeleteChatbotFlowUseCase,
    private createNodeUseCase: CreateChatbotNodeUseCase,
    private updateNodeUseCase: UpdateChatbotNodeUseCase,
    private deleteNodeUseCase: DeleteChatbotNodeUseCase,
    private createEdgeUseCase: CreateChatbotEdgeUseCase,
    private deleteEdgeUseCase: DeleteChatbotEdgeUseCase,
    private processMessageUseCase: ProcessChatbotMessageUseCase
  ) {}

  private getTenantId(req: AuthenticatedRequest): string {
    // Security: Use tenantId from JWT token, not from headers
    if (!req.user?.tenantId) {
      throw new Error('Tenant ID not found in authentication context');
    }
    return req.user.tenantId;
  }

  // Bot management
  async getBots(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const bots = await this.getBotsUseCase.execute({ tenantId });
      
      res.json({
        success: true,
        data: bots
      });
    } catch (error) {
      console.error('Error getting bots:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bots'
      });
    }
  }

  async createBot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      
      // Validate request body using Zod schema
      const validatedData = insertChatbotBotSchema.parse({
        ...req.body,
        tenantId
      });

      const bot = await this.createBotUseCase.execute(validatedData);
      
      res.status(201).json({
        success: true,
        data: bot,
        message: 'Chatbot created successfully'
      });
    } catch (error) {
      console.error('Error creating bot:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create bot'
        });
      }
    }
  }

  async getBot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { botId } = req.params;
      
      // Get bot with tenant validation using dedicated use case
      const bot = await this.getBotByIdUseCase.execute({ botId, tenantId });
      
      if (!bot) {
        res.status(404).json({
          success: false,
          error: 'Bot not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: bot
      });
    } catch (error) {
      console.error('Error getting bot:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bot'
      });
    }
  }

  async updateBot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { botId } = req.params;
      
      // Validate request body using Zod schema
      const validatedData = updateChatbotBotSchema.parse(req.body);

      const updatedBot = await this.updateBotUseCase.execute({
        botId,
        tenantId,
        ...validatedData
      });
      
      res.json({
        success: true,
        data: updatedBot,
        message: 'Bot updated successfully'
      });
    } catch (error) {
      console.error('Error updating bot:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update bot'
        });
      }
    }
  }

  async deleteBot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { botId } = req.params;
      
      const success = await this.deleteBotUseCase.execute({ botId, tenantId });
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Bot not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Bot deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting bot:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete bot'
      });
    }
  }

  async toggleBot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { botId } = req.params;
      
      const updatedBot = await this.toggleBotUseCase.execute({ botId, tenantId });
      
      res.json({
        success: true,
        data: updatedBot,
        message: `Bot ${updatedBot.isEnabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('Error toggling bot:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle bot'
      });
    }
  }

  // Flow management
  async getFlows(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { botId } = req.params;
      
      const flows = await this.getFlowsUseCase.execute({ botId, tenantId });
      
      res.json({
        success: true,
        data: flows
      });
    } catch (error) {
      console.error('Error getting flows:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get flows'
      });
    }
  }

  async createFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { botId } = req.params;
      
      // Validate request body using Zod schema
      const validatedData = insertChatbotFlowSchema.parse({
        ...req.body,
        botId,
        tenantId
      });

      const flow = await this.createFlowUseCase.execute(validatedData);
      
      res.status(201).json({
        success: true,
        data: flow,
        message: 'Flow created successfully'
      });
    } catch (error) {
      console.error('Error creating flow:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create flow'
        });
      }
    }
  }

  async getFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      
      // Get flow with tenant validation using dedicated use case
      const flow = await this.getFlowByIdUseCase.execute({ flowId, tenantId });
      
      if (!flow) {
        res.status(404).json({
          success: false,
          error: 'Flow not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: flow
      });
    } catch (error) {
      console.error('Error getting flow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get flow'
      });
    }
  }

  async updateFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      
      // Validate request body using Zod schema
      const validatedData = updateChatbotFlowSchema.parse(req.body);

      const updatedFlow = await this.updateFlowUseCase.execute({
        flowId,
        tenantId,
        ...validatedData
      });
      
      res.json({
        success: true,
        data: updatedFlow,
        message: 'Flow updated successfully'
      });
    } catch (error) {
      console.error('Error updating flow:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update flow'
        });
      }
    }
  }

  async deleteFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      
      const success = await this.deleteFlowUseCase.execute({ flowId, tenantId });
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Flow not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Flow deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting flow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete flow'
      });
    }
  }

  // Node management
  async createNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      
      // Validate request body using Zod schema
      const validatedData = insertChatbotNodeSchema.parse({
        ...req.body,
        flowId,
        tenantId
      });

      const node = await this.createNodeUseCase.execute(validatedData);
      
      res.status(201).json({
        success: true,
        data: node,
        message: 'Node created successfully'
      });
    } catch (error) {
      console.error('Error creating node:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create node'
        });
      }
    }
  }

  async updateNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { nodeId } = req.params;
      
      // Validate request body using Zod schema
      const validatedData = updateChatbotNodeSchema.parse(req.body);

      const updatedNode = await this.updateNodeUseCase.execute({
        nodeId,
        tenantId,
        ...validatedData
      });
      
      res.json({
        success: true,
        data: updatedNode,
        message: 'Node updated successfully'
      });
    } catch (error) {
      console.error('Error updating node:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update node'
        });
      }
    }
  }

  async deleteNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { nodeId } = req.params;
      
      const success = await this.deleteNodeUseCase.execute({ nodeId, tenantId });
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Node not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Node deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting node:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete node'
      });
    }
  }

  // Edge management
  async createEdge(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      
      // Validate request body using Zod schema
      const validatedData = insertChatbotEdgeSchema.parse({
        ...req.body,
        flowId,
        tenantId
      });

      const edge = await this.createEdgeUseCase.execute(validatedData);
      
      res.status(201).json({
        success: true,
        data: edge,
        message: 'Edge created successfully'
      });
    } catch (error) {
      console.error('Error creating edge:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create edge'
        });
      }
    }
  }

  async deleteEdge(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { edgeId } = req.params;
      
      const success = await this.deleteEdgeUseCase.execute({ edgeId, tenantId });
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Edge not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Edge deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting edge:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete edge'
      });
    }
  }

  // Message processing
  async processMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      
      // Validate request body using Zod schema
      const validatedData = processMessageSchema.parse(req.body);

      const result = await this.processMessageUseCase.execute({
        ...validatedData,
        tenantId
      });
      
      res.json({
        success: result.success,
        data: {
          executionId: result.executionId,
          responses: result.responses,
          fallbackToHuman: result.fallbackToHuman
        },
        error: result.error
      });
    } catch (error) {
      console.error('Error processing message:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process message'
        });
      }
    }
  }

  // Execution management
  async getExecution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;
      
      const execution = await this.processMessageUseCase.getExecution(executionId);
      
      if (!execution) {
        res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: execution
      });
    } catch (error) {
      console.error('Error getting execution:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get execution'
      });
    }
  }

  async cancelExecution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;
      
      const success = await this.processMessageUseCase.cancelExecution(executionId);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Execution cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling execution:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel execution'
      });
    }
  }

  // Analytics (placeholder implementation)
  async getBotAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { botId } = req.params;
      
      // TODO: Implement actual analytics use case
      res.json({
        success: true,
        data: {
          botId,
          tenantId,
          totalExecutions: 0,
          successRate: 0,
          averageResponseTime: 0,
          topFlows: [],
          recentActivity: []
        },
        message: 'Analytics not yet implemented'
      });
    } catch (error) {
      console.error('Error getting bot analytics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics'
      });
    }
  }

  async getTenantAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      
      // TODO: Implement actual analytics use case
      res.json({
        success: true,
        data: {
          tenantId,
          totalBots: 0,
          totalExecutions: 0,
          successRate: 0,
          activeFlows: 0,
          messageVolume: []
        },
        message: 'Analytics not yet implemented'
      });
    } catch (error) {
      console.error('Error getting tenant analytics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics'
      });
    }
  }

  // Flow validation (placeholder implementation)
  async validateFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      
      // TODO: Implement actual flow validation use case
      res.json({
        success: true,
        data: {
          flowId,
          tenantId,
          isValid: true,
          errors: [],
          warnings: []
        },
        message: 'Flow validation not yet implemented'
      });
    } catch (error) {
      console.error('Error validating flow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate flow'
      });
    }
  }
}