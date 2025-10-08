import { Request, Response } from 'express';
import { CreateAiAgentUseCase, CreateAiAgentRequest } from '../use-cases/CreateAiAgentUseCase';
import { GetAiAgentsUseCase } from '../use-cases/GetAiAgentsUseCase';
import { ProcessConversationUseCase } from '../use-cases/ProcessConversationUseCase';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { ConversationalAgentEngine } from '../../infrastructure/services/ConversationalAgentEngine';

export class AiAgentController {
  private createAiAgentUseCase: CreateAiAgentUseCase;
  private getAiAgentsUseCase: GetAiAgentsUseCase;
  private processConversationUseCase: ProcessConversationUseCase;

  constructor(
    agentRepository: IAiAgentRepository,
    conversationEngine: ConversationalAgentEngine
  ) {
    this.createAiAgentUseCase = new CreateAiAgentUseCase(agentRepository);
    this.getAiAgentsUseCase = new GetAiAgentsUseCase(agentRepository);
    this.processConversationUseCase = new ProcessConversationUseCase(agentRepository, conversationEngine);
  }

  async createAgent(req: Request, res: Response): Promise<void> {
    console.log('🤖 [CreateAgent] Starting agent creation');
    console.log('🤖 [CreateAgent] Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      console.log('🤖 [CreateAgent] Tenant ID:', tenantId);
      
      if (!tenantId) {
        console.log('❌ [CreateAgent] Missing tenant ID');
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const createRequest: CreateAiAgentRequest = {
        tenantId,
        name: req.body.name,
        description: req.body.description || '',
        personality: req.body.personality || {
          tone: 'professional',
          language: 'pt-BR',
          greeting: 'Olá! Como posso ajudar você hoje?',
          fallbackMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?'
        },
        channels: req.body.channels || [],
        enabledActions: req.body.enabledActions || [],
        conversationConfig: req.body.conversationConfig || {
          useMenus: true,
          maxTurns: 10,
          requireConfirmation: true,
          escalationKeywords: ['humano', 'atendente', 'supervisor']
        },
        aiConfig: req.body.aiConfig || {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1500,
          extractionPrompts: {
            general: 'Extraia as informações necessárias da conversa',
            confirmation: 'Confirme se entendi corretamente:'
          }
        },
        priority: req.body.priority || 1
      };

      const result = await this.createAiAgentUseCase.execute(createRequest);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'AI Agent created successfully',
          data: result.agent
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('❌ [AiAgentController] Error creating agent:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getAgents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const channelType = req.query.channel as string;

      const result = await this.getAiAgentsUseCase.execute({
        tenantId,
        channelType
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.agents
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('❌ [AiAgentController] Error getting agents:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async processMessage(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      const { userId, channelId, channelType, content, metadata } = req.body;

      if (!userId || !channelId || !channelType || !content) {
        res.status(400).json({
          success: false,
          error: 'userId, channelId, channelType, and content are required'
        });
        return;
      }

      const result = await this.processConversationUseCase.execute({
        tenantId,
        userId,
        channelId,
        channelType,
        content,
        metadata
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.response
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('❌ [AiAgentController] Error processing message:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getAgent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const agentId = req.params.id;
      
      console.log('🤖 [GetAgent] Called with:', { tenantId, agentId });
      
      if (!tenantId) {
        console.log('❌ [GetAgent] Missing tenant ID');
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!agentId) {
        console.log('❌ [GetAgent] Missing agent ID');
        res.status(400).json({
          success: false,
          error: 'Agent ID is required'
        });
        return;
      }

      const agentRepository = this.createAiAgentUseCase['agentRepository'] as IAiAgentRepository;
      console.log('🤖 [GetAgent] Finding agent...');
      const agent = await agentRepository.findById(agentId, tenantId);
      console.log('🤖 [GetAgent] Agent found:', agent ? 'Yes' : 'No');
      console.log('🤖 [GetAgent] Agent data:', JSON.stringify(agent, null, 2));

      if (!agent) {
        console.log('❌ [GetAgent] Agent not found, returning 404');
        res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
        return;
      }

      console.log('✅ [GetAgent] Returning agent data to client');
      
      res.json({
        success: true,
        data: agent
      });

    } catch (error) {
      console.error('❌ [AiAgentController] Error getting agent:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateAgent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const agentId = req.params.id;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!agentId) {
        res.status(400).json({
          success: false,
          error: 'Agent ID is required'
        });
        return;
      }

      const agentRepository = this.createAiAgentUseCase['agentRepository'] as IAiAgentRepository;
      const agent = await agentRepository.findById(agentId, tenantId);

      if (!agent) {
        res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
        return;
      }

      // Atualizar campos fornecidos
      if (req.body.name !== undefined) agent.name = req.body.name;
      if (req.body.description !== undefined) agent.description = req.body.description;
      if (req.body.personality !== undefined) agent.personality = req.body.personality;
      if (req.body.channels !== undefined) agent.channels = req.body.channels;
      if (req.body.enabledActions !== undefined) agent.enabledActions = req.body.enabledActions;
      if (req.body.conversationConfig !== undefined) agent.conversationConfig = req.body.conversationConfig;
      if (req.body.aiConfig !== undefined) agent.aiConfig = req.body.aiConfig;
      if (req.body.isActive !== undefined) agent.isActive = req.body.isActive;
      if (req.body.priority !== undefined) agent.priority = req.body.priority;

      const updatedAgent = await agentRepository.update(agent);

      res.json({
        success: true,
        message: 'Agent updated successfully',
        data: updatedAgent
      });

    } catch (error) {
      console.error('❌ [AiAgentController] Error updating agent:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async deleteAgent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const agentId = req.params.id;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      if (!agentId) {
        res.status(400).json({
          success: false,
          error: 'Agent ID is required'
        });
        return;
      }

      const agentRepository = this.createAiAgentUseCase['agentRepository'] as IAiAgentRepository;
      const deleted = await agentRepository.delete(agentId, tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Agent deleted successfully'
      });

    } catch (error) {
      console.error('❌ [AiAgentController] Error deleting agent:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}