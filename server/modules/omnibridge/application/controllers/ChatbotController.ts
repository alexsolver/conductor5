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
      const { nodes, edges, ...flowData } = req.body;

      console.log('🔄 [CONTROLLER] Updating flow:', { 
        flowId, 
        hasNodes: !!nodes, 
        hasEdges: !!edges,
        nodeCount: nodes?.length || 0,
        edgeCount: edges?.length || 0,
        tenantId,
        requestBody: Object.keys(req.body)
      });

      // If nodes and edges are provided, save complete flow
      if (nodes !== undefined || edges !== undefined) {
        console.log('💾 [CONTROLLER] Detected complete flow save request');
        
        // Verify flow exists and belongs to tenant
        let existingFlow = await this.updateFlowUseCase.chatbotFlowRepository.findById(flowId);
        
        // If flow doesn't exist, create it first
        if (!existingFlow) {
          console.log('🔧 [CONTROLLER] Flow not found, creating it first:', flowId);
          
          // Extract botId from flowData or derive from flowId pattern
          const botId = flowData.botId || req.body.botId;
          if (!botId) {
            console.error('❌ [CONTROLLER] Cannot create flow without botId');
            res.status(400).json({
              success: false,
              error: 'BotId is required to create flow'
            });
            return;
          }

          // Verify bot exists and belongs to tenant
          const bot = await this.getBotByIdUseCase.execute({ botId, tenantId });
          if (!bot) {
            console.error('❌ [CONTROLLER] Bot not found or access denied:', { botId, tenantId });
            res.status(404).json({
              success: false,
              error: 'Bot not found or access denied'
            });
            return;
          }

          // Create the flow
          const newFlow = await this.createFlowUseCase.execute({
            id: flowId, // Use the provided flowId
            botId: botId,
            name: flowData.name || 'Fluxo Principal',
            description: flowData.description || 'Fluxo padrão do chatbot',
            version: 1,
            isActive: flowData.isActive !== undefined ? flowData.isActive : true,
            settings: flowData.settings || {}
          });

          existingFlow = newFlow;
          console.log('✅ [CONTROLLER] Flow created successfully:', existingFlow.id);
        }

        console.log('✅ [CONTROLLER] Flow found:', { 
          flowId: existingFlow.id, 
          botId: existingFlow.botId,
          name: existingFlow.name
        });

        // Verify bot belongs to tenant
        const bot = await this.getBotByIdUseCase.execute({ 
          botId: existingFlow.botId, 
          tenantId 
        });
        if (!bot) {
          console.error('❌ [CONTROLLER] Bot not found or access denied:', {
            botId: existingFlow.botId,
            tenantId
          });
          res.status(404).json({
            success: false,
            error: 'Flow not found or access denied',
            details: { botId: existingFlow.botId, tenantId }
          });
          return;
        }

        console.log('✅ [CONTROLLER] Bot found and access verified:', {
          botId: bot.id,
          botName: bot.name
        });

        // Validate nodes and edges before saving
        const validNodes = Array.isArray(nodes) ? nodes : [];
        const validEdges = Array.isArray(edges) ? edges : [];
        
        console.log('📊 [CONTROLLER] Validated data:', {
          validNodeCount: validNodes.length,
          validEdgeCount: validEdges.length,
          sampleNode: validNodes[0] ? {
            id: validNodes[0].id,
            type: validNodes[0].type,
            label: validNodes[0].data?.label || validNodes[0].label
          } : null,
          sampleEdge: validEdges[0] ? {
            id: validEdges[0].id,
            source: validEdges[0].source,
            target: validEdges[0].target
          } : null
        });

        // Save nodes and edges
        const success = await this.updateFlowUseCase.chatbotFlowRepository.saveCompleteFlow(
          flowId,
          validNodes,
          validEdges
        );

        if (success) {
          console.log('✅ [CONTROLLER] Complete flow saved successfully - retrieving updated data');
          
          // Return the updated flow with nodes and edges
          const updatedFlowWithNodes = await this.updateFlowUseCase.chatbotFlowRepository.findWithNodes(flowId);
          
          console.log('📄 [CONTROLLER] Updated flow retrieved:', {
            hasFlow: !!updatedFlowWithNodes,
            nodeCount: updatedFlowWithNodes?.nodes?.length || 0,
            edgeCount: updatedFlowWithNodes?.edges?.length || 0
          });
          
          res.json({
            success: true,
            data: updatedFlowWithNodes || existingFlow,
            message: 'Flow saved successfully',
            metadata: {
              savedNodes: validNodes.length,
              savedEdges: validEdges.length,
              timestamp: new Date().toISOString()
            }
          });
        } else {
          console.error('❌ [CONTROLLER] Failed to save complete flow - repository returned false');
          res.status(500).json({
            success: false,
            error: 'Failed to save flow - database operation failed',
            details: { 
              flowId, 
              nodeCount: validNodes.length, 
              edgeCount: validEdges.length,
              timestamp: new Date().toISOString()
            }
          });
        }
        return;
      }

      // Otherwise, update flow metadata only
      console.log('📝 [CONTROLLER] Updating flow metadata only');
      const validatedData = updateChatbotFlowSchema.parse(flowData);
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
      console.error('❌ [CONTROLLER] Error updating flow:', error);
      
      // Enhanced error logging
      console.error('❌ [CONTROLLER] Error context:', {
        flowId: req.params.flowId,
        tenantId: req.user?.tenantId,
        hasNodes: !!req.body.nodes,
        hasEdges: !!req.body.edges,
        nodeCount: req.body.nodes?.length || 0,
        edgeCount: req.body.edges?.length || 0,
        requestKeys: Object.keys(req.body),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update flow',
          details: {
            flowId: req.params.flowId,
            hasNodes: !!req.body.nodes,
            hasEdges: !!req.body.edges,
            timestamp: new Date().toISOString()
          }
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

  async saveCompleteFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      const { nodes, edges } = req.body;

      console.log('💾 [CONTROLLER] Save complete flow endpoint called:', { 
        flowId, 
        nodeCount: nodes?.length || 0,
        edgeCount: edges?.length || 0,
        tenantId
      });

      // Verify flow exists and belongs to tenant
      const existingFlow = await this.updateFlowUseCase.chatbotFlowRepository.findById(flowId);
      if (!existingFlow) {
        console.error('❌ [CONTROLLER] Flow not found:', flowId);
        res.status(404).json({
          success: false,
          error: 'Flow not found'
        });
        return;
      }

      // Verify bot belongs to tenant
      const bot = await this.getBotByIdUseCase.execute({ 
        botId: existingFlow.botId, 
        tenantId 
      });
      if (!bot) {
        console.error('❌ [CONTROLLER] Bot access denied:', {
          botId: existingFlow.botId,
          tenantId
        });
        res.status(404).json({
          success: false,
          error: 'Flow not found or access denied'
        });
        return;
      }

      // Save nodes and edges
      const success = await this.updateFlowUseCase.chatbotFlowRepository.saveCompleteFlow(
        flowId,
        nodes || [],
        edges || []
      );

      if (success) {
        console.log('✅ [CONTROLLER] Complete flow saved via dedicated endpoint');
        
        // Return the updated flow with nodes and edges
        const updatedFlowWithNodes = await this.updateFlowUseCase.chatbotFlowRepository.findWithNodes(flowId);
        
        res.json({
          success: true,
          data: updatedFlowWithNodes || existingFlow,
          message: 'Flow saved successfully'
        });
      } else {
        console.error('❌ [CONTROLLER] Failed to save complete flow via dedicated endpoint');
        res.status(500).json({
          success: false,
          error: 'Failed to save flow'
        });
      }
    } catch (error) {
      console.error('❌ [CONTROLLER] Error in saveCompleteFlow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save flow'
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

  // Complete flow management
  async saveCompleteFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      const { nodes = [], edges = [] } = req.body;

      console.log('💾 [CONTROLLER] Saving complete flow:', { 
        flowId, 
        nodeCount: nodes.length, 
        edgeCount: edges.length,
        tenantId 
      });

      // Verify flow exists and belongs to tenant
      const existingFlow = await this.updateFlowUseCase.chatbotFlowRepository.findById(flowId);
      if (!existingFlow) {
        res.status(404).json({
          success: false,
          error: 'Flow not found'
        });
        return;
      }

      // Verify bot belongs to tenant
      const bot = await this.getBotByIdUseCase.execute({ 
        botId: existingFlow.botId, 
        tenantId 
      });
      if (!bot) {
        res.status(404).json({
          success: false,
          error: 'Flow not found or access denied'
        });
        return;
      }

      // Save nodes and edges using the repository method
      const success = await this.updateFlowUseCase.chatbotFlowRepository.saveCompleteFlow(
        flowId,
        nodes,
        edges
      );

      if (success) {
        console.log('✅ [CONTROLLER] Complete flow saved successfully');
        res.json({
          success: true,
          message: 'Flow saved successfully'
        });
      } else {
        console.error('❌ [CONTROLLER] Failed to save complete flow');
        res.status(500).json({
          success: false,
          error: 'Failed to save flow'
        });
      }
    } catch (error) {
      console.error('❌ [CONTROLLER] Error saving complete flow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save flow'
      });
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

  // Save complete flow with nodes and edges
  async saveCompleteFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      const { nodes = [], edges = [] } = req.body;

      console.log('💾 [FLOW-SAVE] Saving complete flow:', { flowId, nodeCount: nodes.length, edgeCount: edges.length });

      // Verify flow exists and belongs to tenant
      const existingFlow = await this.getFlowByIdUseCase.execute({ flowId, tenantId });
      if (!existingFlow) {
        res.status(404).json({
          success: false,
          error: 'Flow not found or access denied'
        });
        return;
      }

      // Use the repository method to save nodes and edges
      const success = await this.updateFlowUseCase.chatbotFlowRepository.saveCompleteFlow(flowId, nodes, edges);

      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to save flow'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Flow saved successfully',
        data: { flowId, nodesSaved: nodes.length, edgesSaved: edges.length }
      });

    } catch (error) {
      console.error('Error saving complete flow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save complete flow'
      });
    }
  }

  // Validate flow configuration
  async validateFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;

      // Get flow with nodes and edges
      const flow = await this.updateFlowUseCase.chatbotFlowRepository.findWithNodes(flowId);
      
      if (!flow) {
        res.status(404).json({
          success: false,
          error: 'Flow not found'
        });
        return;
      }

      // Basic validation rules
      const errors = [];
      const warnings = [];

      // Check if flow has nodes
      if (!flow.nodes || flow.nodes.length === 0) {
        warnings.push('Flow has no nodes defined');
      }

      // Check for start node
      const startNodes = flow.nodes?.filter(node => node.type === 'start') || [];
      if (startNodes.length === 0) {
        errors.push('Flow must have at least one start node');
      }

      // Check for orphaned nodes (nodes without connections)
      if (flow.nodes && flow.edges) {
        const connectedNodeIds = new Set();
        flow.edges.forEach(edge => {
          connectedNodeIds.add(edge.sourceNodeId);
          connectedNodeIds.add(edge.targetNodeId);
        });

        const orphanedNodes = flow.nodes.filter(node => !connectedNodeIds.has(node.id));
        if (orphanedNodes.length > 0) {
          warnings.push(`Found ${orphanedNodes.length} orphaned nodes`);
        }
      }

      res.json({
        success: true,
        data: {
          flowId,
          isValid: errors.length === 0,
          errors,
          warnings,
          stats: {
            nodeCount: flow.nodes?.length || 0,
            edgeCount: flow.edges?.length || 0
          }
        }
      });

    } catch (error) {
      console.error('Error validating flow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate flow'
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
        success: true,
        data: result
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

  async saveCompleteFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = this.getTenantId(req);
      const { flowId } = req.params;
      const { nodes = [], edges = [] } = req.body;

      // Verify flow exists and belongs to tenant
      const flow = await this.getFlowByIdUseCase.execute({ flowId, tenantId });

      if (!flow) {
        res.status(404).json({
          success: false,
          error: 'Flow not found'
        });
        return;
      }

      const success = await this.updateFlowUseCase['chatbotFlowRepository'].saveCompleteFlow(flowId, nodes, edges);

      if (!success) {
        res.status(500).json({
          success: false,
          error: 'Failed to save flow'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Flow saved successfully'
      });
    } catch (error) {
      console.error('Error saving complete flow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save flow'
      });
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