import { Request, Response } from 'express';
import { CreateAiAgentUseCase } from '../use-cases/CreateAiAgentUseCase';
import { GetAiAgentsUseCase } from '../use-cases/GetAiAgentsUseCase';
import { GetAiAgentByIdUseCase } from '../use-cases/GetAiAgentByIdUseCase';
import { UpdateAiAgentUseCase } from '../use-cases/UpdateAiAgentUseCase';
import { DeleteAiAgentUseCase } from '../use-cases/DeleteAiAgentUseCase';
import { IAiAgentRepository } from '../../domain/repositories/IAiAgentRepository';
import { InternalFormsIntegrationService } from '../../infrastructure/services/InternalFormsIntegrationService';

export class AiAgentController {
  private createUseCase: CreateAiAgentUseCase;
  private getAgentsUseCase: GetAiAgentsUseCase;
  private getByIdUseCase: GetAiAgentByIdUseCase;
  private updateUseCase: UpdateAiAgentUseCase;
  private deleteUseCase: DeleteAiAgentUseCase;
  private formsService: InternalFormsIntegrationService;

  constructor(agentRepository: IAiAgentRepository) {
    this.createUseCase = new CreateAiAgentUseCase(agentRepository);
    this.getAgentsUseCase = new GetAiAgentsUseCase(agentRepository);
    this.getByIdUseCase = new GetAiAgentByIdUseCase(agentRepository);
    this.updateUseCase = new UpdateAiAgentUseCase(agentRepository);
    this.deleteUseCase = new DeleteAiAgentUseCase(agentRepository);
    this.formsService = new InternalFormsIntegrationService();
  }

  async createAgent(req: Request, res: Response): Promise<void> {
    try {
      console.log('🎯 [AiAgentController] createAgent called');
      console.log('📦 [AiAgentController] Request body:', req.body);
      console.log('🔑 [AiAgentController] Headers:', req.headers);
      
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id;
      
      console.log('🏢 [AiAgentController] TenantId:', tenantId);
      console.log('👤 [AiAgentController] UserId:', userId);
      
      if (!tenantId) {
        console.log('❌ [AiAgentController] Missing tenant ID');
        res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
        return;
      }

      const agentData = {
        tenantId,
        name: req.body.name,
        description: req.body.description,
        configPrompt: req.body.configPrompt,
        allowedFormIds: req.body.allowedFormIds || [],
        createdBy: userId || 'system'
      };
      
      console.log('📝 [AiAgentController] Creating agent with data:', agentData);

      const result = await this.createUseCase.execute(agentData);

      console.log('✅ [AiAgentController] Create result:', result);

      if (result.success) {
        res.status(201).json({ success: true, data: result.agent });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('❌ [AiAgentController] Error creating agent:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async getAgents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
        return;
      }

      const result = await this.getAgentsUseCase.execute({ tenantId });

      if (result.success) {
        res.json({ success: true, data: result.agents });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('❌ [AiAgentController] Error fetching agents:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async getAgent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
        return;
      }

      const result = await this.getByIdUseCase.execute({ id, tenantId });

      if (result.success) {
        res.json({ success: true, data: result.agent });
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('❌ [AiAgentController] Error fetching agent:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async updateAgent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
        return;
      }

      const result = await this.updateUseCase.execute({
        id,
        tenantId,
        ...req.body
      });

      if (result.success) {
        res.json({ success: true, data: result.agent });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('❌ [AiAgentController] Error updating agent:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deleteAgent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
        return;
      }

      const result = await this.deleteUseCase.execute({ id, tenantId });

      if (result.success) {
        res.json({ success: true, message: 'Agente excluído com sucesso' });
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('❌ [AiAgentController] Error deleting agent:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async getAvailableForms(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID é obrigatório' });
        return;
      }

      const forms = await this.formsService.getFormsByTenant(tenantId);
      
      res.json({ 
        success: true, 
        data: forms.map(f => ({ 
          id: f.id, 
          name: f.name, 
          description: f.description,
          category: f.category 
        }))
      });
    } catch (error) {
      console.error('❌ [AiAgentController] Error fetching forms:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}
