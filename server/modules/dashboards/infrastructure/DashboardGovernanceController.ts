// Dashboard Governance Controller - Clean Architecture following 1qa.md
import { Request, Response } from 'express';
import { DashboardGovernanceService } from '../domain/DashboardGovernanceService';
import { GovernedCardSchema } from '@shared/dashboard-governance-schema';

export class DashboardGovernanceController {
  private governanceService: DashboardGovernanceService;

  constructor() {
    this.governanceService = new DashboardGovernanceService();
  }

  // GET /api/dashboards/governance/data-sources
  async getDataSources(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      const dataSources = await this.governanceService.getAvailableDataSources(tenantId);
      
      res.json({
        success: true,
        data: dataSources,
        message: 'Data sources retrieved successfully'
      });
    } catch (error) {
      console.error('[GOVERNANCE-CONTROLLER] Failed to get data sources:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve data sources'
      });
    }
  }

  // GET /api/dashboards/governance/kpis/:dataSourceId
  async getKPIs(req: Request, res: Response) {
    try {
      const { dataSourceId } = req.params;
      
      if (!dataSourceId) {
        return res.status(400).json({
          success: false,
          message: 'Data source ID is required'
        });
      }

      const kpis = await this.governanceService.getAvailableKPIs(dataSourceId);
      
      res.json({
        success: true,
        data: kpis,
        message: 'KPIs retrieved successfully'
      });
    } catch (error) {
      console.error('[GOVERNANCE-CONTROLLER] Failed to get KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve KPIs'
      });
    }
  }

  // POST /api/dashboards/kpi/:kpiId
  async calculateKPI(req: Request, res: Response) {
    try {
      const { kpiId } = req.params;
      const { filters, scope_rules, tenant_id, user_id } = req.body;
      const tenantId = tenant_id || (req as any).tenantId;
      const userId = user_id || (req as any).user?.id;

      if (!kpiId || !tenantId) {
        return res.status(400).json({
          success: false,
          message: 'KPI ID and Tenant ID are required'
        });
      }

      // ✅ 1QA.MD COMPLIANCE: Get KPI definition
      const availableKPIs = await this.governanceService.getAvailableKPIs('tickets'); // TODO: dynamic lookup
      const kpi = availableKPIs.find(k => k.id === kpiId);
      
      if (!kpi) {
        return res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
      }

      // Calculate KPI with governance rules
      const kpiValue = await this.governanceService.calculateKPIValue(
        kpi, 
        filters || [], 
        tenantId
      );

      res.json({
        success: true,
        data: kpiValue,
        message: 'KPI calculated successfully'
      });
    } catch (error) {
      console.error('[GOVERNANCE-CONTROLLER] Failed to calculate KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate KPI'
      });
    }
  }

  // POST /api/dashboards/governance/validate-card
  async validateCard(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      // Validate request body against schema
      const parseResult = GovernedCardSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card configuration',
          errors: parseResult.error.errors
        });
      }

      const card = parseResult.data;
      const isValid = await this.governanceService.validateCardConfiguration(card, tenantId);
      
      res.json({
        success: true,
        data: { 
          is_valid: isValid,
          card_id: card.id 
        },
        message: isValid ? 'Card configuration is valid' : 'Card configuration has issues'
      });
    } catch (error) {
      console.error('[GOVERNANCE-CONTROLLER] Failed to validate card:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate card configuration'
      });
    }
  }

  // POST /api/dashboards/governance/generate-dynamic
  async generateDynamicCard(req: Request, res: Response) {
    try {
      const { template } = req.body;
      const tenantId = (req as any).tenantId;
      
      if (!template || !tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Template and Tenant ID are required'
        });
      }

      const dynamicCard = await this.governanceService.generateDynamicCard(template, tenantId);
      
      res.json({
        success: true,
        data: dynamicCard,
        message: 'Dynamic card generated successfully'
      });
    } catch (error) {
      console.error('[GOVERNANCE-CONTROLLER] Failed to generate dynamic card:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate dynamic card'
      });
    }
  }

  // GET /api/dashboards/governance/permissions/:cardId
  async checkPermissions(req: Request, res: Response) {
    try {
      const { cardId } = req.params;
      const { action } = req.query;
      const userId = (req as any).user?.id;
      
      if (!cardId || !action || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Card ID, action, and user authentication are required'
        });
      }

      const hasPermission = await this.governanceService.validateUserPermissions(
        cardId, 
        action as string, 
        userId
      );
      
      res.json({
        success: true,
        data: { 
          has_permission: hasPermission,
          card_id: cardId,
          action,
          user_id: userId
        },
        message: 'Permission check completed'
      });
    } catch (error) {
      console.error('[GOVERNANCE-CONTROLLER] Failed to check permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check permissions'
      });
    }
  }
}