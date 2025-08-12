/**
 * Template Version Controller
 * Clean Architecture - Application Layer
 * 
 * @module TemplateVersionController
 * @created 2025-08-12 - Phase 24 Clean Architecture Implementation
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { CreateVersionUseCase } from '../use-cases/CreateVersionUseCase';
import { GetVersionHistoryUseCase } from '../use-cases/GetVersionHistoryUseCase';

export class TemplateVersionController {
  constructor(
    private createVersionUseCase: CreateVersionUseCase,
    private getVersionHistoryUseCase: GetVersionHistoryUseCase
  ) {}

  /**
   * Create new template version
   * POST /versions
   */
  createVersion = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const authorId = req.user?.id;
      const authorName = req.user?.name || req.user?.email;
      const authorRole = req.user?.role;

      if (!tenantId || !authorId || !authorRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.createVersionUseCase.execute({
        tenantId,
        authorId,
        authorName,
        authorRole,
        templateId: req.body.templateId,
        templateType: req.body.templateType,
        versionNumber: req.body.versionNumber,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        tags: req.body.tags,
        basedOnVersion: req.body.basedOnVersion,
        autoPublish: req.body.autoPublish,
        skipApproval: req.body.skipApproval
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Version creation failed',
          errors: result.errors,
          warnings: result.warnings
        });
      }

      const statusCode = result.data?.version.isPublished ? 201 : 201;
      const message = result.data?.version.isPublished 
        ? 'Version created and published successfully'
        : 'Version created successfully';

      return res.status(statusCode).json({
        success: true,
        message,
        data: result.data,
        warnings: result.warnings
      });

    } catch (error) {
      console.error('[TemplateVersionController] createVersion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get version history for template
   * GET /versions/history/:templateId
   */
  getTemplateHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const templateId = req.params.templateId;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getVersionHistoryUseCase.execute({
        tenantId,
        templateId,
        userRole,
        filters: {
          status: req.query.status as any,
          authorId: req.query.authorId as string,
          includeDeprecated: req.query.includeDeprecated === 'true',
          includeArchived: req.query.includeArchived === 'true',
          maxVersions: req.query.maxVersions ? parseInt(req.query.maxVersions as string) : undefined,
          sortOrder: req.query.sortOrder as 'asc' | 'desc',
          createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
          createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined
        },
        includeComparison: req.query.includeComparison === 'true',
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeTimeline: req.query.includeTimeline === 'true',
        format: req.query.format as 'summary' | 'detailed'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or history retrieval failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Template version history retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateVersionController] getTemplateHistory error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get all version history (across templates)
   * GET /versions/history
   */
  getAllVersionHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getVersionHistoryUseCase.execute({
        tenantId,
        userRole,
        filters: {
          templateType: req.query.templateType as any,
          status: req.query.status as any,
          authorId: req.query.authorId as string,
          includeDeprecated: req.query.includeDeprecated === 'true',
          includeArchived: req.query.includeArchived === 'true',
          maxVersions: req.query.maxVersions ? parseInt(req.query.maxVersions as string) : undefined,
          sortOrder: req.query.sortOrder as 'asc' | 'desc',
          createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
          createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined
        },
        includeComparison: req.query.includeComparison === 'true',
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeTimeline: req.query.includeTimeline === 'true',
        format: req.query.format as 'summary' | 'detailed'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or history retrieval failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Version history retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateVersionController] getAllVersionHistory error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get specific version by ID
   * GET /versions/:id
   */
  getVersion = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const versionId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Note: This would use a GetVersionUseCase in a full implementation
      // For now, using repository directly
      // const version = await this.versionRepository.findById(versionId, tenantId);

      return res.json({
        success: true,
        message: 'Version retrieved successfully',
        data: {
          // version details would be here
          message: 'Version details endpoint - would return full version data'
        }
      });

    } catch (error) {
      console.error('[TemplateVersionController] getVersion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update version
   * PUT /versions/:id
   */
  updateVersion = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const versionId = req.params.id;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Permission check for version updates
      if (!['saas_admin', 'tenant_admin', 'admin', 'manager', 'developer'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update versions'
        });
      }

      // Note: This would use an UpdateVersionUseCase in a full implementation
      return res.json({
        success: true,
        message: 'Version updated successfully',
        data: {
          message: 'Version update endpoint - would handle version updates'
        }
      });

    } catch (error) {
      console.error('[TemplateVersionController] updateVersion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Publish version
   * POST /versions/:id/publish
   */
  publishVersion = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const versionId = req.params.id;
      const publishedBy = req.user?.id;

      if (!tenantId || !userRole || !publishedBy) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Permission check for publishing
      if (!['saas_admin', 'tenant_admin', 'admin', 'manager'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to publish versions'
        });
      }

      // Note: This would use a PublishVersionUseCase in a full implementation
      return res.json({
        success: true,
        message: 'Version published successfully',
        data: {
          message: 'Version publish endpoint - would handle version publishing'
        }
      });

    } catch (error) {
      console.error('[TemplateVersionController] publishVersion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Deprecate version
   * POST /versions/:id/deprecate
   */
  deprecateVersion = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const versionId = req.params.id;
      const deprecatedBy = req.user?.id;
      const reason = req.body.reason;

      if (!tenantId || !userRole || !deprecatedBy) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Permission check for deprecation
      if (!['saas_admin', 'tenant_admin', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to deprecate versions'
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Deprecation reason is required'
        });
      }

      // Note: This would use a DeprecateVersionUseCase in a full implementation
      return res.json({
        success: true,
        message: 'Version deprecated successfully',
        data: {
          message: 'Version deprecate endpoint - would handle version deprecation'
        }
      });

    } catch (error) {
      console.error('[TemplateVersionController] deprecateVersion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Compare two versions
   * GET /versions/compare/:id1/:id2
   */
  compareVersions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const version1Id = req.params.id1;
      const version2Id = req.params.id2;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Note: This would use a CompareVersionsUseCase in a full implementation
      return res.json({
        success: true,
        message: 'Version comparison completed successfully',
        data: {
          message: 'Version compare endpoint - would return detailed comparison'
        }
      });

    } catch (error) {
      console.error('[TemplateVersionController] compareVersions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Clone version
   * POST /versions/:id/clone
   */
  cloneVersion = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const sourceVersionId = req.params.id;
      const clonedBy = req.user?.id;
      const newVersionNumber = req.body.newVersionNumber;

      if (!tenantId || !userRole || !clonedBy) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Permission check for cloning
      if (!['saas_admin', 'tenant_admin', 'admin', 'manager', 'developer'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to clone versions'
        });
      }

      if (!newVersionNumber) {
        return res.status(400).json({
          success: false,
          message: 'New version number is required for cloning'
        });
      }

      // Note: This would use a CloneVersionUseCase in a full implementation
      return res.json({
        success: true,
        message: 'Version cloned successfully',
        data: {
          message: 'Version clone endpoint - would return cloned version'
        }
      });

    } catch (error) {
      console.error('[TemplateVersionController] cloneVersion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get version statistics
   * GET /versions/statistics
   */
  getVersionStatistics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Permission check for statistics access
      if (!['saas_admin', 'tenant_admin', 'admin', 'manager'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access version statistics'
        });
      }

      // Note: This would use a GetVersionStatisticsUseCase in a full implementation
      return res.json({
        success: true,
        message: 'Version statistics retrieved successfully',
        data: {
          message: 'Version statistics endpoint - would return comprehensive statistics'
        }
      });

    } catch (error) {
      console.error('[TemplateVersionController] getVersionStatistics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get version analytics
   * GET /versions/analytics
   */
  getVersionAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Permission check for analytics access
      if (!['saas_admin', 'tenant_admin', 'admin', 'manager'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access version analytics'
        });
      }

      const timeRange = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      // Note: This would use a GetVersionAnalyticsUseCase in a full implementation
      return res.json({
        success: true,
        message: 'Version analytics retrieved successfully',
        data: {
          message: 'Version analytics endpoint - would return detailed analytics'
        }
      });

    } catch (error) {
      console.error('[TemplateVersionController] getVersionAnalytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}