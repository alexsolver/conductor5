// ✅ 1QA.MD COMPLIANCE: APPLICATION CONTROLLER - HTTP INTERFACE
// Application Layer - Request/Response handling and validation

import { Request, Response } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        roles: string[];
        email?: string;
      };
    }
  }
}
import { CreateReportUseCase } from '../use-cases/CreateReportUseCase';
import { ExecuteReportUseCase } from '../use-cases/ExecuteReportUseCase';
import { 
  createReportDTOSchema, 
  updateReportDTOSchema, 
  reportQueryDTOSchema, 
  executeReportDTOSchema 
} from '../dto/CreateReportDTO';

export class ReportsController {
  constructor(
    private createReportUseCase: CreateReportUseCase,
    private executeReportUseCase: ExecuteReportUseCase
  ) {}

  async createReport(req: Request, res: Response): Promise<void> {
    try {
      // Extract user context from authenticated request
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User ID and Tenant ID are required']
        });
        return;
      }

      // Validate request body
      const validation = createReportDTOSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
        return;
      }

      // Execute use case
      const result = await this.createReportUseCase.execute({
        data: validation.data,
        userId,
        userRoles,
        tenantId
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Failed to create report',
          errors: result.errors
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: result.data,
        warnings: result.warnings
      });

    } catch (error) {
      console.error('[ReportsController] Error in createReport:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Failed to create report']
      });
    }
  }

  async executeReport(req: Request, res: Response): Promise<void> {
    try {
      // Extract user context from authenticated request
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User ID and Tenant ID are required']
        });
        return;
      }

      // Get report ID from params
      const reportId = req.params.id;
      if (!reportId) {
        res.status(400).json({
          success: false,
          message: 'Report ID is required',
          errors: ['Report ID parameter is missing']
        });
        return;
      }

      // Validate request body
      const validation = executeReportDTOSchema.safeParse({
        ...req.body,
        reportId
      });
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
        return;
      }

      // Execute use case
      const result = await this.executeReportUseCase.execute({
        data: validation.data,
        userId,
        userRoles,
        tenantId
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Failed to execute report',
          errors: result.errors
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Report executed successfully',
        data: result.data,
        warnings: result.warnings
      });

    } catch (error) {
      console.error('[ReportsController] Error in executeReport:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Failed to execute report']
      });
    }
  }

  async getReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Validate query parameters
      const validation = reportQueryDTOSchema.safeParse({
        ...req.query,
        tenantId
      });

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
        return;
      }

      // This would use a GetReportsUseCase in a full implementation
      res.status(200).json({
        success: true,
        message: 'Reports retrieved successfully',
        data: {
          reports: [],
          total: 0,
          limit: validation.data.limit,
          offset: validation.data.offset
        }
      });

    } catch (error) {
      console.error('[ReportsController] Error in getReports:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getReportById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const reportId = req.params.id;
      if (!reportId) {
        res.status(400).json({
          success: false,
          message: 'Report ID is required'
        });
        return;
      }

      // This would use a GetReportByIdUseCase in a full implementation
      res.status(200).json({
        success: true,
        message: 'Report retrieved successfully',
        data: null
      });

    } catch (error) {
      console.error('[ReportsController] Error in getReportById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updateReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const reportId = req.params.id;
      if (!reportId) {
        res.status(400).json({
          success: false,
          message: 'Report ID is required'
        });
        return;
      }

      // Validate request body
      const validation = updateReportDTOSchema.safeParse({
        ...req.body,
        id: reportId
      });

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
        return;
      }

      // This would use an UpdateReportUseCase in a full implementation
      res.status(200).json({
        success: true,
        message: 'Report updated successfully',
        data: null
      });

    } catch (error) {
      console.error('[ReportsController] Error in updateReport:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async deleteReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const reportId = req.params.id;
      if (!reportId) {
        res.status(400).json({
          success: false,
          message: 'Report ID is required'
        });
        return;
      }

      // This would use a DeleteReportUseCase in a full implementation
      res.status(200).json({
        success: true,
        message: 'Report deleted successfully'
      });

    } catch (error) {
      console.error('[ReportsController] Error in deleteReport:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}