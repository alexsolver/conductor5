// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - CONTROLLERS LAYER
// API Controller: ApprovalController - REST endpoints for approval management

import { Request, Response } from 'express';
import { z } from 'zod';

// Import repositories
import { DrizzleApprovalRuleRepository } from '../infrastructure/repositories/DrizzleApprovalRuleRepository';
import { DrizzleApprovalInstanceRepository } from '../infrastructure/repositories/DrizzleApprovalInstanceRepository';

// Import domain services
import { ApprovalRuleEngine } from '../domain/services/ApprovalRuleEngine';
import { EscalationService } from '../domain/services/EscalationService';

// Import application commands and queries
import { CreateApprovalRuleCommand } from '../application/commands/CreateApprovalRuleCommand';
import { UpdateApprovalRuleCommand } from '../application/commands/UpdateApprovalRuleCommand';
import { DeleteApprovalRuleCommand } from '../application/commands/DeleteApprovalRuleCommand';
import { CreateApprovalInstanceCommand } from '../application/commands/CreateApprovalInstanceCommand';
import { ProcessApprovalDecisionCommand } from '../application/commands/ProcessApprovalDecisionCommand';

import { GetApprovalRulesQuery } from '../application/queries/GetApprovalRulesQuery';
import { GetApprovalRuleByIdQuery } from '../application/queries/GetApprovalRuleByIdQuery';
import { GetApprovalInstancesQuery } from '../application/queries/GetApprovalInstancesQuery';

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1, "Nome da regra é obrigatório"),
  description: z.string().optional(),
  moduleType: z.enum(['tickets', 'materials', 'knowledge_base', 'timecard', 'contracts']),
  entityType: z.string().min(1, "Tipo de entidade é obrigatório"),
  queryConditions: z.any(),
  approvalSteps: z.array(z.any()).min(1, "Pelo menos uma etapa é obrigatória"),
  defaultSlaHours: z.number().min(1, "SLA deve ser pelo menos 1 hora"),
  escalationEnabled: z.boolean().optional(),
  autoApprovalEnabled: z.boolean().optional(),
  autoApprovalConditions: z.any().optional(),
  priority: z.number().int().min(1).max(999).optional(),
});

const updateRuleSchema = createRuleSchema.partial().extend({
  id: z.string().uuid("ID inválido"),
});

const createInstanceSchema = z.object({
  entityType: z.enum(['tickets', 'materials', 'knowledge_base', 'timecard', 'contracts']),
  entityId: z.string().min(1, "ID da entidade é obrigatório"),
  entityData: z.record(z.any()).optional(),
  requestReason: z.string().optional(),
  urgencyLevel: z.number().int().min(1).max(5).optional(),
  ruleId: z.string().uuid().optional(),
});

const processDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'delegated', 'escalated']),
  comments: z.string().min(1, "Comentários são obrigatórios"),
  reasonCode: z.string().optional(),
  delegatedToId: z.string().uuid().optional(),
  delegationReason: z.string().optional(),
});

export class ApprovalController {
  private approvalRuleRepository: DrizzleApprovalRuleRepository;
  private approvalInstanceRepository: DrizzleApprovalInstanceRepository;
  private approvalRuleEngine: ApprovalRuleEngine;
  private escalationService: EscalationService;

  // Application services
  private createApprovalRuleCommand: CreateApprovalRuleCommand;
  private updateApprovalRuleCommand: UpdateApprovalRuleCommand;
  private deleteApprovalRuleCommand: DeleteApprovalRuleCommand;
  private createApprovalInstanceCommand: CreateApprovalInstanceCommand;
  private processApprovalDecisionCommand: ProcessApprovalDecisionCommand;

  private getApprovalRulesQuery: GetApprovalRulesQuery;
  private getApprovalRuleByIdQuery: GetApprovalRuleByIdQuery;
  private getApprovalInstancesQuery: GetApprovalInstancesQuery;

  constructor() {
    // Initialize repositories
    this.approvalRuleRepository = new DrizzleApprovalRuleRepository();
    this.approvalInstanceRepository = new DrizzleApprovalInstanceRepository();

    // Initialize domain services
    this.approvalRuleEngine = new ApprovalRuleEngine();
    this.escalationService = new EscalationService();

    // Initialize application commands
    this.createApprovalRuleCommand = new CreateApprovalRuleCommand(
      this.approvalRuleRepository,
      this.approvalRuleEngine
    );
    this.updateApprovalRuleCommand = new UpdateApprovalRuleCommand(
      this.approvalRuleRepository,
      this.approvalRuleEngine
    );
    this.deleteApprovalRuleCommand = new DeleteApprovalRuleCommand(
      this.approvalRuleRepository,
      this.approvalInstanceRepository
    );
    this.createApprovalInstanceCommand = new CreateApprovalInstanceCommand(
      this.approvalInstanceRepository,
      this.approvalRuleRepository,
      this.approvalRuleEngine
    );
    this.processApprovalDecisionCommand = new ProcessApprovalDecisionCommand(
      this.approvalInstanceRepository,
      this.approvalRuleEngine
    );

    // Initialize application queries
    this.getApprovalRulesQuery = new GetApprovalRulesQuery(this.approvalRuleRepository);
    this.getApprovalRuleByIdQuery = new GetApprovalRuleByIdQuery(this.approvalRuleRepository);
    this.getApprovalInstancesQuery = new GetApprovalInstancesQuery(this.approvalInstanceRepository);
  }

  // ========================================
  // APPROVAL RULES ENDPOINTS
  // ========================================

  /**
   * GET /api/approvals/rules
   * Get approval rules with optional filters
   */
  async getApprovalRules(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      const query = req.query;
      const response = await this.getApprovalRulesQuery.execute({
        tenantId,
        moduleType: query.moduleType as string,
        entityType: query.entityType as string,
        isActive: query.isActive ? query.isActive === 'true' : undefined,
        createdById: query.createdById as string,
        search: query.search as string,
      });

      if (!response.success) {
        res.status(400).json({ error: response.error });
        return;
      }

      res.json({
        data: response.data,
        total: response.total,
      });
    } catch (error) {
      console.error('Error in getApprovalRules:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/approvals/rules/:id
   * Get specific approval rule by ID
   */
  async getApprovalRuleById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      const response = await this.getApprovalRuleByIdQuery.execute({
        id,
        tenantId,
      });

      if (!response.success) {
        res.status(404).json({ error: response.error });
        return;
      }

      res.json({ data: response.data });
    } catch (error) {
      console.error('Error in getApprovalRuleById:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * POST /api/approvals/rules
   * Create new approval rule
   */
  async createApprovalRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // Validate request body
      const validation = createRuleSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Dados inválidos',
          validationErrors: validation.error.errors.map(e => e.message),
        });
        return;
      }

      const response = await this.createApprovalRuleCommand.execute({
        tenantId,
        createdById: userId,
        ...validation.data,
      });

      if (!response.success) {
        res.status(400).json({
          error: response.error,
          validationErrors: response.validationErrors,
        });
        return;
      }

      res.status(201).json({ data: response.data });
    } catch (error) {
      console.error('Error in createApprovalRule:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * PUT /api/approvals/rules/:id
   * Update existing approval rule
   */
  async updateApprovalRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // Validate request body
      const validation = updateRuleSchema.safeParse({ ...req.body, id });
      if (!validation.success) {
        res.status(400).json({
          error: 'Dados inválidos',
          validationErrors: validation.error.errors.map(e => e.message),
        });
        return;
      }

      const response = await this.updateApprovalRuleCommand.execute({
        id,
        tenantId,
        updatedById: userId,
        ...validation.data,
      });

      if (!response.success) {
        res.status(400).json({
          error: response.error,
          validationErrors: response.validationErrors,
        });
        return;
      }

      res.json({ data: response.data });
    } catch (error) {
      console.error('Error in updateApprovalRule:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * DELETE /api/approvals/rules/:id
   * Delete approval rule
   */
  async deleteApprovalRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { id } = req.params;
      const { force } = req.query;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const response = await this.deleteApprovalRuleCommand.execute({
        id,
        tenantId,
        deletedById: userId,
        force: force === 'true',
      });

      if (!response.success) {
        res.status(400).json({ error: response.error });
        return;
      }

      res.json({
        message: 'Regra de aprovação excluída com sucesso',
        warning: response.warning,
      });
    } catch (error) {
      console.error('Error in deleteApprovalRule:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ========================================
  // APPROVAL INSTANCES ENDPOINTS
  // ========================================

  /**
   * GET /api/approvals/instances
   * Get approval instances with optional filters and pagination
   */
  async getApprovalInstances(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      const query = req.query;
      const response = await this.getApprovalInstancesQuery.execute({
        tenantId,
        status: query.status as string | string[],
        entityType: query.entityType as string,
        entityId: query.entityId as string,
        requestedById: query.requestedById as string,
        ruleId: query.ruleId as string,
        urgencyLevel: query.urgencyLevel ? parseInt(query.urgencyLevel as string) : undefined,
        slaViolated: query.slaViolated ? query.slaViolated === 'true' : undefined,
        overdueOnly: query.overdueOnly === 'true',
        dateFrom: query.dateFrom ? new Date(query.dateFrom as string) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo as string) : undefined,
        page: query.page ? parseInt(query.page as string) : undefined,
        limit: query.limit ? parseInt(query.limit as string) : undefined,
        includeDetails: query.includeDetails === 'true',
      });

      if (!response.success) {
        res.status(400).json({ error: response.error });
        return;
      }

      res.json({
        data: response.data,
        total: response.total,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
      });
    } catch (error) {
      console.error('Error in getApprovalInstances:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * POST /api/approvals/instances
   * Create new approval instance
   */
  async createApprovalInstance(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // Validate request body
      const validation = createInstanceSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Dados inválidos',
          validationErrors: validation.error.errors.map(e => e.message),
        });
        return;
      }

      const response = await this.createApprovalInstanceCommand.execute({
        tenantId,
        requestedById: userId,
        ...validation.data,
      });

      if (!response.success) {
        if (response.noApplicableRules) {
          res.status(404).json({ error: response.error });
        } else {
          res.status(400).json({
            error: response.error,
            validationErrors: response.validationErrors,
          });
        }
        return;
      }

      res.status(201).json({ data: response.data });
    } catch (error) {
      console.error('Error in createApprovalInstance:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * POST /api/approvals/instances/:id/decision
   * Process approval decision
   */
  async processApprovalDecision(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { id: instanceId } = req.params;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // Validate request body
      const validation = processDecisionSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Dados inválidos',
          validationErrors: validation.error.errors.map(e => e.message),
        });
        return;
      }

      const response = await this.processApprovalDecisionCommand.execute({
        tenantId,
        instanceId,
        approverId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        ...validation.data,
      });

      if (!response.success) {
        res.status(400).json({
          error: response.error,
          validationErrors: response.validationErrors,
        });
        return;
      }

      res.json({
        message: 'Decisão processada com sucesso',
        data: response.data,
      });
    } catch (error) {
      console.error('Error in processApprovalDecision:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ========================================
  // DASHBOARD/METRICS ENDPOINTS
  // ========================================

  /**
   * GET /api/approvals/dashboard
   * Get approval dashboard metrics
   */
  async getApprovalDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      // Get various metrics
      const [
        statusCounts,
        totalRules,
        overdueCount,
        totalInstances,
        averageResponseTime,
        slaCompliance
      ] = await Promise.all([
        this.approvalInstanceRepository.countByStatus(tenantId),
        this.approvalRuleRepository.countByTenant(tenantId),
        this.approvalInstanceRepository.countOverdue(tenantId),
        this.approvalInstanceRepository.countByTenant(tenantId),
        this.approvalInstanceRepository.getAverageResponseTime(tenantId),
        this.approvalInstanceRepository.getSlaComplianceRate(tenantId)
      ]);

      res.json({
        data: {
          statusCounts,
          totalRules,
          totalInstances,
          overdueCount,
          averageResponseTime,
          slaCompliance,
          pendingCount: statusCounts.pending || 0,
          approvedCount: statusCounts.approved || 0,
          rejectedCount: statusCounts.rejected || 0,
        },
      });
    } catch (error) {
      console.error('Error in getApprovalDashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}