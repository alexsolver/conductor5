// ✅ 1QA.MD COMPLIANCE: SLA APPLICATION CONTROLLER
// Clean Architecture application controller for SLA endpoints

import { Request, Response } from 'express';
import { SlaService } from '../services/SlaService';
import { DrizzleSlaRepository } from '../../infrastructure/repositories/DrizzleSlaRepository';
import { 
  insertSlaDefinitionSchema,
  insertSlaInstanceSchema,
  insertSlaViolationSchema 
} from '@shared/schema-sla';

export class SlaController {
  private slaService: SlaService;

  constructor() {
    const slaRepository = new DrizzleSlaRepository();
    this.slaService = new SlaService(slaRepository);
  }

  // ===== SLA DEFINITIONS =====

  // GET /api/sla/definitions - Get all SLA definitions for tenant
  async getSlaDefinitions(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Getting SLA definitions for tenant:', tenantId);

      const definitions = await this.slaService.getSlaDefinitions(tenantId);

      res.status(200).json({
        success: true,
        data: definitions,
        total: definitions.length
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error getting SLA definitions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SLA definitions'
      });
    }
  }

  // GET /api/sla/definitions/:id - Get specific SLA definition
  async getSlaDefinitionById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and SLA ID are required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Getting SLA definition:', id);

      const definition = await this.slaService.getSlaDefinitionById(id, tenantId);

      if (!definition) {
        res.status(404).json({
          success: false,
          error: 'SLA definition not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: definition
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error getting SLA definition:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SLA definition'
      });
    }
  }

  // POST /api/sla/definitions - Create new SLA definition
  async createSlaDefinition(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const userId = user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Creating SLA definition for tenant:', tenantId);
      console.log('[SLA-CONTROLLER] Request body received:', JSON.stringify(req.body, null, 2));
      console.log('[SLA-CONTROLLER] validFrom type:', typeof req.body.validFrom, req.body.validFrom);
      console.log('[SLA-CONTROLLER] validUntil type:', typeof req.body.validUntil, req.body.validUntil);

      // Transform timeTargets to the expected legacy format for backend compatibility
      const transformedBody = { ...req.body };
      if (transformedBody.timeTargets && Array.isArray(transformedBody.timeTargets)) {
        // Map timeTargets array to individual time fields for backend compatibility
        const timeTargetsMap = transformedBody.timeTargets.reduce((acc: any, target: any) => {
          if (target.metric === 'response_time') {
            acc.responseTimeMinutes = target.unit === 'hours' ? target.target * 60 : 
                                     target.unit === 'days' ? target.target * 1440 : target.target;
          } else if (target.metric === 'resolution_time') {
            acc.resolutionTimeMinutes = target.unit === 'hours' ? target.target * 60 : 
                                       target.unit === 'days' ? target.target * 1440 : target.target;
          } else if (target.metric === 'update_time') {
            acc.updateTimeMinutes = target.unit === 'hours' ? target.target * 60 : 
                                   target.unit === 'days' ? target.target * 1440 : target.target;
          } else if (target.metric === 'idle_time') {
            acc.idleTimeMinutes = target.unit === 'hours' ? target.target * 60 : 
                                 target.unit === 'days' ? target.target * 1440 : target.target;
          }
          return acc;
        }, {});
        
        // Add the individual time fields to the body
        Object.assign(transformedBody, timeTargetsMap);
      }

      // Ensure at least one time target is specified
      if (!transformedBody.responseTimeMinutes && !transformedBody.resolutionTimeMinutes && 
          !transformedBody.updateTimeMinutes && !transformedBody.idleTimeMinutes) {
        res.status(400).json({
          success: false,
          error: 'At least one time target must be specified. Example: [{"metric": "response_time", "target": 30, "unit": "minutes", "priority": "high"}]'
        });
        return;
      }

      // Validate request body
      const validationResult = insertSlaDefinitionSchema.safeParse(transformedBody);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid SLA definition data',
          details: validationResult.error.issues
        });
        return;
      }

      const slaData = {
        ...validationResult.data,
        tenantId,
        createdBy: userId
      };

      const definition = await this.slaService.createSlaDefinition(slaData);

      res.status(201).json({
        success: true,
        data: definition,
        message: 'SLA definition created successfully'
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error creating SLA definition:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create SLA definition'
        });
      }
    }
  }

  // PUT /api/sla/definitions/:id - Update SLA definition
  async updateSlaDefinition(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and SLA ID are required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Updating SLA definition:', id);

      const definition = await this.slaService.updateSlaDefinition(id, tenantId, req.body);

      if (!definition) {
        res.status(404).json({
          success: false,
          error: 'SLA definition not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: definition,
        message: 'SLA definition updated successfully'
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error updating SLA definition:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update SLA definition'
        });
      }
    }
  }

  // DELETE /api/sla/definitions/:id - Delete SLA definition
  async deleteSlaDefinition(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and SLA ID are required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Deleting SLA definition:', id);

      const success = await this.slaService.deleteSlaDefinition(id, tenantId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'SLA definition not found or cannot be deleted'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'SLA definition deleted successfully'
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error deleting SLA definition:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete SLA definition'
        });
      }
    }
  }

  // ===== SLA INSTANCES =====

  // GET /api/sla/instances/ticket/:ticketId - Get SLA instances for ticket
  async getSlaInstancesByTicket(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { ticketId } = req.params;

      if (!tenantId || !ticketId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID and Ticket ID are required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Getting SLA instances for ticket:', ticketId);

      const repository = new DrizzleSlaRepository();
      const instances = await repository.getSlaInstancesByTicket(ticketId, tenantId);

      res.status(200).json({
        success: true,
        data: instances,
        total: instances.length
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error getting SLA instances:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SLA instances'
      });
    }
  }

  // GET /api/sla/instances/active - Get active SLA instances
  async getActiveSlaInstances(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Getting active SLA instances for tenant:', tenantId);

      const repository = new DrizzleSlaRepository();
      const instances = await repository.getActiveSlaInstances(tenantId);

      res.status(200).json({
        success: true,
        data: instances,
        total: instances.length
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error getting active SLA instances:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active SLA instances'
      });
    }
  }

  // GET /api/sla/instances/breached - Get breached SLA instances
  async getBreachedSlaInstances(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Getting breached SLA instances for tenant:', tenantId);

      const repository = new DrizzleSlaRepository();
      const instances = await repository.getBreachedSlaInstances(tenantId);

      res.status(200).json({
        success: true,
        data: instances,
        total: instances.length
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error getting breached SLA instances:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get breached SLA instances'
      });
    }
  }

  // ===== SLA VIOLATIONS =====

  // GET /api/sla/violations - Get SLA violations
  async getSlaViolations(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { ticketId, slaDefinitionId, unresolved } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Getting SLA violations for tenant:', tenantId);

      const repository = new DrizzleSlaRepository();
      let violations;

      if (unresolved === 'true') {
        violations = await repository.getUnresolvedViolations(tenantId);
      } else if (ticketId) {
        violations = await repository.getSlaViolationsByTicket(ticketId as string, tenantId);
      } else if (slaDefinitionId) {
        violations = await repository.getSlaViolationsByDefinition(slaDefinitionId as string, tenantId);
      } else {
        violations = await repository.getUnresolvedViolations(tenantId);
      }

      res.status(200).json({
        success: true,
        data: violations,
        total: violations.length
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error getting SLA violations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SLA violations'
      });
    }
  }

  // ===== SLA ANALYTICS =====

  // GET /api/sla/analytics/compliance - Get SLA compliance statistics
  async getSlaComplianceStats(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { startDate, endDate } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Getting compliance stats for tenant:', tenantId);

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await this.slaService.getSlaComplianceStats(tenantId, start, end);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error getting compliance stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance statistics'
      });
    }
  }

  // GET /api/sla/analytics/performance - Get SLA performance metrics
  async getSlaPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;
      const { slaDefinitionId } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Getting performance metrics for tenant:', tenantId);

      const metrics = await this.slaService.getSlaPerformanceMetrics(
        tenantId, 
        slaDefinitionId as string
      );

      res.status(200).json({
        success: true,
        data: metrics,
        total: metrics.length
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance metrics'
      });
    }
  }

  // POST /api/sla/monitoring/check-breaches - Check for SLA breaches
  async checkSlaBreaches(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
        return;
      }

      console.log('[SLA-CONTROLLER] Checking SLA breaches for tenant:', tenantId);

      const breachedInstances = await this.slaService.checkSlaBreaches(tenantId);

      res.status(200).json({
        success: true,
        data: breachedInstances,
        total: breachedInstances.length,
        message: `Found ${breachedInstances.length} new SLA breaches`
      });
    } catch (error) {
      console.error('[SLA-CONTROLLER] Error checking SLA breaches:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check SLA breaches'
      });
    }
  }
}