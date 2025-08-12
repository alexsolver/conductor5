/**
 * Template Audit Controller
 * Clean Architecture - Application Layer
 * 
 * @module TemplateAuditController
 * @created 2025-08-12 - Phase 23 Clean Architecture Implementation
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { CreateAuditEntryUseCase } from '../use-cases/CreateAuditEntryUseCase';
import { GetAuditReportsUseCase } from '../use-cases/GetAuditReportsUseCase';

export class TemplateAuditController {
  constructor(
    private createAuditEntryUseCase: CreateAuditEntryUseCase,
    private getAuditReportsUseCase: GetAuditReportsUseCase
  ) {}

  /**
   * Create audit entry
   * POST /audit/entries
   */
  createAuditEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const userName = req.user?.name || req.user?.email;
      const userRole = req.user?.role;

      if (!tenantId || !userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.createAuditEntryUseCase.execute({
        tenantId,
        userId,
        userName,
        userRole,
        sessionId: req.sessionID || `session_${Date.now()}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        templateId: req.body.templateId,
        templateType: req.body.templateType,
        auditType: req.body.auditType,
        action: req.body.action,
        entityType: req.body.entityType,
        entityId: req.body.entityId,
        entityName: req.body.entityName,
        description: req.body.description,
        reason: req.body.reason,
        changes: req.body.changes,
        severity: req.body.severity,
        category: req.body.category,
        tags: req.body.tags,
        context: req.body.context
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Audit entry creation failed',
          errors: result.errors,
          warnings: result.warnings
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Audit entry created successfully',
        data: result.data,
        warnings: result.warnings
      });

    } catch (error) {
      console.error('[TemplateAuditController] createAuditEntry error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get audit summary report
   * GET /audit/reports/summary
   */
  getSummaryReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getAuditReportsUseCase.execute({
        tenantId,
        userRole,
        reportType: 'summary',
        filters: {
          templateType: req.query.templateType as any,
          auditType: req.query.auditType as any,
          category: req.query.category as any,
          severity: req.query.severity as string,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        },
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or report generation failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Audit summary report generated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateAuditController] getSummaryReport error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get detailed audit report
   * GET /audit/reports/detailed
   */
  getDetailedReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getAuditReportsUseCase.execute({
        tenantId,
        userRole,
        reportType: 'detailed',
        filters: {
          templateType: req.query.templateType as any,
          auditType: req.query.auditType as any,
          category: req.query.category as any,
          severity: req.query.severity as string,
          status: req.query.status as string,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        },
        pagination: {
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 50
        },
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or report generation failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Detailed audit report generated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateAuditController] getDetailedReport error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get compliance report
   * GET /audit/reports/compliance
   */
  getComplianceReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getAuditReportsUseCase.execute({
        tenantId,
        userRole,
        reportType: 'compliance',
        filters: {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        },
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or report generation failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Compliance report generated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateAuditController] getComplianceReport error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get risk analysis report
   * GET /audit/reports/risk
   */
  getRiskReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getAuditReportsUseCase.execute({
        tenantId,
        userRole,
        reportType: 'risk',
        filters: {
          templateType: req.query.templateType as any,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        },
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or report generation failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Risk analysis report generated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateAuditController] getRiskReport error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get user activity report
   * GET /audit/reports/user-activity/:userId
   */
  getUserActivityReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      const targetUserId = req.params.userId;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getAuditReportsUseCase.execute({
        tenantId,
        userRole,
        reportType: 'user_activity',
        userId: targetUserId,
        filters: {
          templateType: req.query.templateType as any,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        },
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or report generation failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'User activity report generated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateAuditController] getUserActivityReport error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get template history report
   * GET /audit/reports/template-history/:templateId
   */
  getTemplateHistoryReport = async (req: AuthenticatedRequest, res: Response) => {
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

      const result = await this.getAuditReportsUseCase.execute({
        tenantId,
        userRole,
        reportType: 'template_history',
        templateId,
        filters: {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        },
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or report generation failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Template history report generated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateAuditController] getTemplateHistoryReport error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get anomaly detection report
   * GET /audit/reports/anomaly
   */
  getAnomalyReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.getAuditReportsUseCase.execute({
        tenantId,
        userRole,
        reportType: 'anomaly',
        filters: {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        },
        includeAnalytics: req.query.includeAnalytics === 'true',
        includeRecommendations: req.query.includeRecommendations === 'true'
      });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or report generation failed',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Anomaly detection report generated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[TemplateAuditController] getAnomalyReport error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get audit statistics
   * GET /audit/statistics
   */
  getAuditStatistics = async (req: AuthenticatedRequest, res: Response) => {
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
      if (!['saas_admin', 'tenant_admin', 'admin', 'auditor'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access audit statistics'
        });
      }

      const result = await this.getAuditReportsUseCase.execute({
        tenantId,
        userRole,
        reportType: 'summary',
        filters: {
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        },
        includeAnalytics: true
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate audit statistics',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Audit statistics retrieved successfully',
        data: {
          statistics: result.data?.summary,
          analytics: result.data?.analytics,
          metadata: result.data?.metadata
        }
      });

    } catch (error) {
      console.error('[TemplateAuditController] getAuditStatistics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}