import { Request, Response } from 'express';
import { CreateApprovalRuleUseCase } from '../use-cases/CreateApprovalRuleUseCase';
import { ExecuteApprovalFlowUseCase } from '../use-cases/ExecuteApprovalFlowUseCase';
import { ProcessApprovalDecisionUseCase } from '../use-cases/ProcessApprovalDecisionUseCase';
import { IApprovalRuleRepository } from '../../domain/repositories/IApprovalRuleRepository';
import { IApprovalInstanceRepository } from '../../domain/repositories/IApprovalInstanceRepository';
import { ApprovalRuleEngine } from '../../domain/services/ApprovalRuleEngine';

export class ApprovalController {
  private createApprovalRuleUseCase: CreateApprovalRuleUseCase;
  private executeApprovalFlowUseCase: ExecuteApprovalFlowUseCase;
  private processApprovalDecisionUseCase: ProcessApprovalDecisionUseCase;

  constructor(
    private approvalRuleRepository: IApprovalRuleRepository,
    private approvalInstanceRepository: IApprovalInstanceRepository,
    private ruleEngine: ApprovalRuleEngine
  ) {
    this.createApprovalRuleUseCase = new CreateApprovalRuleUseCase(
      approvalRuleRepository,
      ruleEngine
    );
    this.executeApprovalFlowUseCase = new ExecuteApprovalFlowUseCase(
      approvalRuleRepository,
      approvalInstanceRepository,
      ruleEngine
    );
    this.processApprovalDecisionUseCase = new ProcessApprovalDecisionUseCase(
      approvalInstanceRepository
    );
  }

  // Approval Rules endpoints
  async getApprovalRules(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user as any;
      const filters = {
        moduleType: req.query.moduleType as string,
        isActive: req.query.isActive === 'true',
        priority: req.query.priority ? parseInt(req.query.priority as string) : undefined,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const rules = await this.approvalRuleRepository.findAll(tenantId, filters);
      const stats = await this.approvalRuleRepository.getStats(tenantId);

      res.status(200).json({
        success: true,
        data: {
          rules,
          stats,
          count: rules.length
        }
      });
    } catch (error) {
      console.error('Error fetching approval rules:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar regras de aprovação',
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async getApprovalRuleById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;

      const rule = await this.approvalRuleRepository.findById(id, tenantId);
      
      if (!rule) {
        res.status(404).json({
          success: false,
          message: 'Regra de aprovação não encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: rule
      });
    } catch (error) {
      console.error('Error fetching approval rule:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar regra de aprovação',
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async createApprovalRule(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user as any;
      const ruleData = req.body;

      const rule = await this.createApprovalRuleUseCase.execute(
        tenantId,
        ruleData,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Regra de aprovação criada com sucesso',
        data: rule
      });
    } catch (error) {
      console.error('Error creating approval rule:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar regra de aprovação'
      });
    }
  }

  async updateApprovalRule(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user as any;
      const { id } = req.params;
      const ruleData = req.body;

      const rule = await this.approvalRuleRepository.update(
        id,
        tenantId,
        ruleData,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Regra de aprovação atualizada com sucesso',
        data: rule
      });
    } catch (error) {
      console.error('Error updating approval rule:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao atualizar regra de aprovação'
      });
    }
  }

  async deleteApprovalRule(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;

      await this.approvalRuleRepository.delete(id, tenantId);

      res.status(200).json({
        success: true,
        message: 'Regra de aprovação removida com sucesso'
      });
    } catch (error) {
      console.error('Error deleting approval rule:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao remover regra de aprovação'
      });
    }
  }

  // Approval Instances endpoints
  async getApprovalInstances(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user as any;
      const filters = {
        status: req.query.status as any,
        entityType: req.query.entityType as any,
        requestedById: req.query.requestedById as string,
        ruleId: req.query.ruleId as string,
        slaStatus: req.query.slaStatus as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const instances = await this.approvalInstanceRepository.findAll(tenantId, filters);
      const stats = await this.approvalInstanceRepository.getStats(tenantId);

      res.status(200).json({
        success: true,
        data: {
          instances,
          stats,
          count: instances.length
        }
      });
    } catch (error) {
      console.error('Error fetching approval instances:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar instâncias de aprovação',
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async getApprovalInstanceById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;

      const instance = await this.approvalInstanceRepository.findById(id, tenantId);
      
      if (!instance) {
        res.status(404).json({
          success: false,
          message: 'Instância de aprovação não encontrada'
        });
        return;
      }

      // Get related decisions
      const decisions = await this.approvalInstanceRepository.findDecisionsByInstance(
        tenantId,
        id
      );

      res.status(200).json({
        success: true,
        data: {
          instance,
          decisions
        }
      });
    } catch (error) {
      console.error('Error fetching approval instance:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar instância de aprovação',
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async executeApprovalFlow(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user as any;
      const approvalRequest = {
        ...req.body,
        requestedById: userId
      };

      const result = await this.executeApprovalFlowUseCase.execute(
        tenantId,
        approvalRequest
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error executing approval flow:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao executar fluxo de aprovação'
      });
    }
  }

  async processApprovalDecision(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user as any;
      const { id } = req.params;
      const decisionRequest = {
        ...req.body,
        instanceId: id,
        approverId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const result = await this.processApprovalDecisionUseCase.execute(
        tenantId,
        decisionRequest,
        new Date()
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error processing approval decision:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao processar decisão de aprovação'
      });
    }
  }

  async getPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user as any;

      const pendingInstances = await this.approvalInstanceRepository.findPendingByUser(
        tenantId,
        userId
      );

      res.status(200).json({
        success: true,
        data: {
          instances: pendingInstances,
          count: pendingInstances.length
        }
      });
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar aprovações pendentes',
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async getUserDecisions(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const decisions = await this.approvalInstanceRepository.findUserDecisions(
        tenantId,
        userId,
        limit
      );

      res.status(200).json({
        success: true,
        data: {
          decisions,
          count: decisions.length
        }
      });
    } catch (error) {
      console.error('Error fetching user decisions:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar decisões do usuário',
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }
}