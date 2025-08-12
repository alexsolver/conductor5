/**
 * Field Layout Controller
 * Clean Architecture - Application Layer
 * 
 * @module FieldLayoutController
 * @created 2025-08-12 - Phase 21 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { CreateFieldLayoutUseCase } from '../use-cases/CreateFieldLayoutUseCase';
import { GetFieldLayoutsUseCase } from '../use-cases/GetFieldLayoutsUseCase';

export class FieldLayoutController {
  constructor(
    private createFieldLayoutUseCase: CreateFieldLayoutUseCase,
    private getFieldLayoutsUseCase: GetFieldLayoutsUseCase
  ) {}

  /**
   * Create field layout
   * POST /field-layouts
   */
  createLayout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!tenantId || !userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.createFieldLayoutUseCase.execute({
        tenantId,
        name: req.body.name,
        description: req.body.description,
        module: req.body.module,
        sections: req.body.sections || [],
        settings: req.body.settings,
        isDefault: req.body.isDefault,
        tags: req.body.tags,
        createdBy: userId,
        userRole
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: result.errors,
          warnings: result.warnings
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Field layout created successfully',
        data: result.data,
        warnings: result.warnings
      });

    } catch (error) {
      console.error('[FieldLayoutController] createLayout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get all layouts or specific layout
   * GET /field-layouts
   * GET /field-layouts/:id
   */
  getLayouts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const layoutId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getFieldLayoutsUseCase.execute({
        tenantId,
        layoutId,
        userRole,
        filters: {
          module: req.query.module as string,
          status: req.query.status as string,
          isDefault: req.query.isDefault ? req.query.isDefault === 'true' : undefined,
          isSystem: req.query.isSystem ? req.query.isSystem === 'true' : undefined,
          tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
        },
        search: req.query.search as string,
        includeAnalytics: req.query.includeAnalytics === 'true',
        includePerformance: req.query.includePerformance === 'true',
        includeAccessibility: req.query.includeAccessibility === 'true'
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Layouts not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Layouts retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[FieldLayoutController] getLayouts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get layouts by module
   * GET /field-layouts/module/:module
   */
  getLayoutsByModule = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const module = req.params.module;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getFieldLayoutsUseCase.execute({
        tenantId,
        userRole,
        filters: {
          module,
          status: req.query.status as string,
          isDefault: req.query.isDefault ? req.query.isDefault === 'true' : undefined
        }
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Module layouts not found',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Module layouts retrieved successfully',
        data: {
          module,
          layouts: result.data?.layouts || []
        }
      });

    } catch (error) {
      console.error('[FieldLayoutController] getLayoutsByModule error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get default layouts
   * GET /field-layouts/defaults
   */
  getDefaultLayouts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getFieldLayoutsUseCase.execute({
        tenantId,
        userRole,
        filters: {
          isDefault: true,
          module: req.query.module as string
        }
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get default layouts',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Default layouts retrieved successfully',
        data: {
          layouts: result.data?.layouts || []
        }
      });

    } catch (error) {
      console.error('[FieldLayoutController] getDefaultLayouts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get layout analytics
   * GET /field-layouts/:id/analytics
   */
  getLayoutAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const layoutId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getFieldLayoutsUseCase.execute({
        tenantId,
        layoutId,
        userRole,
        includeAnalytics: true,
        includePerformance: true,
        includeAccessibility: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Layout not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Layout analytics retrieved successfully',
        data: {
          analytics: result.data?.analytics,
          performanceReport: result.data?.performanceReport,
          accessibilityReport: result.data?.accessibilityReport,
          fieldAnalytics: result.data?.fieldAnalytics
        }
      });

    } catch (error) {
      console.error('[FieldLayoutController] getLayoutAnalytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get available modules
   * GET /field-layouts/modules
   */
  getAvailableModules = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getFieldLayoutsUseCase.execute({
        tenantId,
        userRole,
        includeAnalytics: true
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get modules',
          errors: result.errors
        });
      }

      // Extract unique modules from layouts
      const modules = result.data?.layouts 
        ? [...new Set(result.data.layouts.map(l => l.module))]
        : [];

      const moduleStats = result.data?.analytics?.layoutsByModule || {};

      return res.json({
        success: true,
        message: 'Available modules retrieved successfully',
        data: {
          modules,
          moduleStats,
          totalModules: modules.length
        }
      });

    } catch (error) {
      console.error('[FieldLayoutController] getAvailableModules error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Search layouts
   * GET /field-layouts/search
   */
  searchLayouts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const query = req.query.q as string;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const result = await this.getFieldLayoutsUseCase.execute({
        tenantId,
        userRole,
        search: query,
        filters: {
          module: req.query.module as string,
          tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
        }
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Search failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Search completed successfully',
        data: {
          layouts: result.data?.layouts || [],
          query,
          count: result.data?.layouts?.length || 0
        }
      });

    } catch (error) {
      console.error('[FieldLayoutController] searchLayouts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get layout performance metrics
   * GET /field-layouts/:id/performance
   */
  getLayoutPerformance = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const layoutId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getFieldLayoutsUseCase.execute({
        tenantId,
        layoutId,
        userRole,
        includePerformance: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Layout not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: result.data?.performanceReport
      });

    } catch (error) {
      console.error('[FieldLayoutController] getLayoutPerformance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get layout accessibility report
   * GET /field-layouts/:id/accessibility
   */
  getLayoutAccessibility = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const layoutId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getFieldLayoutsUseCase.execute({
        tenantId,
        layoutId,
        userRole,
        includeAccessibility: true
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Layout not found or access denied',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Accessibility report retrieved successfully',
        data: result.data?.accessibilityReport
      });

    } catch (error) {
      console.error('[FieldLayoutController] getLayoutAccessibility error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}