// ✅ 1QA.MD COMPLIANCE: SLA WORKFLOW CONTROLLER
// Application layer controller for workflow management

import { Request, Response } from 'express';
import { CreateSlaWorkflowUseCase } from '../use-cases/CreateSlaWorkflowUseCase';
import { ExecuteSlaWorkflowUseCase } from '../use-cases/ExecuteSlaWorkflowUseCase';
import { DrizzleSlaWorkflowRepository } from '../../infrastructure/repositories/DrizzleSlaWorkflowRepository';
import { SlaWorkflowDomainService } from '../../domain/services/SlaWorkflowDomainService';

export class SlaWorkflowController {
  private createWorkflowUseCase: CreateSlaWorkflowUseCase;
  private executeWorkflowUseCase: ExecuteSlaWorkflowUseCase;
  private workflowRepository: DrizzleSlaWorkflowRepository;
  private workflowDomainService: SlaWorkflowDomainService;

  constructor() {
    this.workflowRepository = new DrizzleSlaWorkflowRepository();
    this.workflowDomainService = new SlaWorkflowDomainService();

    this.createWorkflowUseCase = new CreateSlaWorkflowUseCase(
      this.workflowRepository,
      this.workflowDomainService
    );

    this.executeWorkflowUseCase = new ExecuteSlaWorkflowUseCase(
      this.workflowRepository,
      this.workflowDomainService
    );
  }

  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const workflow = await this.createWorkflowUseCase.execute({
        ...req.body,
        tenantId
      });

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      console.error('[SLA-WORKFLOW-CONTROLLER] Create workflow error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create workflow'
      });
    }
  }

  async getWorkflows(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      const workflows = await this.workflowRepository.findByTenant(tenantId);

      res.json({
        success: true,
        data: workflows || []
      });
    } catch (error: any) {
      console.error('[SlaWorkflowController] Error fetching workflows:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching SLA workflows',
        error: error.message || 'Unknown error'
      });
    }
  }

  async getWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const workflow = await this.workflowRepository.findById(id, tenantId);
      if (!workflow) {
        res.status(404).json({ success: false, message: 'Workflow not found' });
        return;
      }

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      console.error('[SLA-WORKFLOW-CONTROLLER] Get workflow error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workflow'
      });
    }
  }

  async updateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const workflow = await this.workflowRepository.update(id, tenantId, req.body);

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      console.error('[SLA-WORKFLOW-CONTROLLER] Update workflow error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update workflow'
      });
    }
  }

  async deleteWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const deleted = await this.workflowRepository.delete(id, tenantId);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Workflow not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Workflow deleted successfully'
      });
    } catch (error) {
      console.error('[SLA-WORKFLOW-CONTROLLER] Delete workflow error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete workflow'
      });
    }
  }

  async executeWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const execution = await this.executeWorkflowUseCase.execute({
        workflowId: id,
        tenantId,
        triggeredBy: req.user?.id || 'system',
        eventType: req.body.eventType || 'manual_trigger',
        eventData: req.body.eventData || {}
      });

      res.json({
        success: true,
        data: execution
      });
    } catch (error) {
      console.error('[SLA-WORKFLOW-CONTROLLER] Execute workflow error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute workflow'
      });
    }
  }

  async getWorkflowExecutions(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const executions = await this.workflowRepository.findExecutionsByWorkflow(id, tenantId);

      res.json({
        success: true,
        data: executions
      });
    } catch (error) {
      console.error('[SLA-WORKFLOW-CONTROLLER] Get executions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workflow executions'
      });
    }
  }

  async getWorkflowStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const stats = await this.workflowRepository.getWorkflowStats(id, tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[SLA-WORKFLOW-CONTROLLER] Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workflow statistics'
      });
    }
  }

  async getActiveTriggers(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const activeWorkflows = await this.workflowRepository.findActiveTriggers(tenantId);

      res.json({
        success: true,
        data: activeWorkflows
      });
    } catch (error) {
      console.error('[SLA-WORKFLOW-CONTROLLER] Get active triggers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active triggers'
      });
    }
  }
}