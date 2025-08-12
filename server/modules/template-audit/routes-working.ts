/**
 * Template Audit Working Routes
 * Clean Architecture - Presentation Layer
 * 
 * @module TemplateAuditWorkingRoutes
 * @created 2025-08-12 - Phase 23 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

// Domain
import { SimplifiedTemplateAuditRepository } from './infrastructure/repositories/SimplifiedTemplateAuditRepository';

// Application
import { CreateAuditEntryUseCase } from './application/use-cases/CreateAuditEntryUseCase';
import { GetAuditReportsUseCase } from './application/use-cases/GetAuditReportsUseCase';
import { TemplateAuditController } from './application/controllers/TemplateAuditController';

const router = Router();

// Initialize repository
const auditRepository = new SimplifiedTemplateAuditRepository();

// Initialize use cases
const createAuditEntryUseCase = new CreateAuditEntryUseCase(auditRepository);
const getAuditReportsUseCase = new GetAuditReportsUseCase(auditRepository);

// Initialize controller
const auditController = new TemplateAuditController(
  createAuditEntryUseCase,
  getAuditReportsUseCase
);

/**
 * Working status endpoint
 * GET /working/status
 */
router.get('/status', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Template Audit working routes are operational',
      phase: 23,
      module: 'template-audit',
      status: 'working',
      architecture: 'Clean Architecture',
      layers: {
        domain: 'TemplateAudit entities and business rules',
        application: 'Use cases and controllers',
        infrastructure: 'Repository implementations',
        presentation: 'HTTP routes and responses'
      },
      features: {
        auditTrail: 'Comprehensive audit trail with change tracking',
        riskAssessment: 'Automated risk scoring and threat detection',
        complianceValidation: 'Multi-standard compliance checking',
        anomalyDetection: 'Pattern analysis and anomaly identification',
        auditReports: 'Detailed reporting and analytics',
        chainIntegrity: 'Cryptographic integrity validation',
        performanceMonitoring: 'Real-time performance tracking',
        userActivityTracking: 'Detailed user behavior analysis',
        securityEventLogging: 'Security-focused event capture',
        retentionManagement: 'Automated data lifecycle management'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed'
    });
  }
});

// ===========================
// AUDIT ENTRY MANAGEMENT
// ===========================

/**
 * Create audit entry
 * POST /working/audit/entries
 */
router.post('/audit/entries', jwtAuth, auditController.createAuditEntry);

/**
 * Get audit entries
 * GET /working/audit/entries
 */
router.get('/audit/entries', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const audits = await auditRepository.findAll(tenantId, {
      templateId: req.query.templateId as string,
      templateType: req.query.templateType as any,
      auditType: req.query.auditType as any,
      action: req.query.action as any,
      userId: req.query.userId as string,
      category: req.query.category as any,
      severity: req.query.severity as string,
      status: req.query.status as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    });

    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    const paginatedAudits = audits.slice(offset, offset + limit);

    res.json({
      success: true,
      message: 'Audit entries retrieved successfully',
      data: {
        audits: paginatedAudits,
        pagination: {
          total: audits.length,
          page,
          limit,
          pages: Math.ceil(audits.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Get audit entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get audit entry by ID
 * GET /working/audit/entries/:id
 */
router.get('/audit/entries/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const auditId = req.params.id;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const audit = await auditRepository.findById(auditId, tenantId);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Audit entry retrieved successfully',
      data: audit
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Get audit entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// AUDIT REPORTS
// ===========================

/**
 * Get audit summary report
 * GET /working/audit/reports/summary
 */
router.get('/audit/reports/summary', jwtAuth, auditController.getSummaryReport);

/**
 * Get detailed audit report
 * GET /working/audit/reports/detailed
 */
router.get('/audit/reports/detailed', jwtAuth, auditController.getDetailedReport);

/**
 * Get compliance report
 * GET /working/audit/reports/compliance
 */
router.get('/audit/reports/compliance', jwtAuth, auditController.getComplianceReport);

/**
 * Get risk analysis report
 * GET /working/audit/reports/risk
 */
router.get('/audit/reports/risk', jwtAuth, auditController.getRiskReport);

/**
 * Get user activity report
 * GET /working/audit/reports/user-activity/:userId
 */
router.get('/audit/reports/user-activity/:userId', jwtAuth, auditController.getUserActivityReport);

/**
 * Get template history report
 * GET /working/audit/reports/template-history/:templateId
 */
router.get('/audit/reports/template-history/:templateId', jwtAuth, auditController.getTemplateHistoryReport);

/**
 * Get anomaly detection report
 * GET /working/audit/reports/anomaly
 */
router.get('/audit/reports/anomaly', jwtAuth, auditController.getAnomalyReport);

/**
 * Get audit statistics
 * GET /working/audit/statistics
 */
router.get('/audit/statistics', jwtAuth, auditController.getAuditStatistics);

// ===========================
// COMPLIANCE & INTEGRITY
// ===========================

/**
 * Validate compliance for audit entry
 * POST /working/audit/compliance/validate/:auditId
 */
router.post('/audit/compliance/validate/:auditId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const auditId = req.params.auditId;
    const standards = req.body.standards || ['SOX', 'GDPR'];

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validation = await auditRepository.validateCompliance(tenantId, auditId, standards);

    res.json({
      success: true,
      message: 'Compliance validation completed',
      data: validation
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Validate compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Validate chain integrity
 * GET /working/audit/integrity/validate
 */
router.get('/audit/integrity/validate', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const templateId = req.query.templateId as string;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validation = await auditRepository.validateChainIntegrity(tenantId, templateId);

    res.json({
      success: true,
      message: 'Chain integrity validation completed',
      data: validation
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Validate chain integrity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Repair chain integrity
 * POST /working/audit/integrity/repair
 */
router.post('/audit/integrity/repair', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const auditIds = req.body.auditIds;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!['saas_admin', 'tenant_admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for integrity repair'
      });
    }

    if (!Array.isArray(auditIds) || auditIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Audit IDs array is required'
      });
    }

    const repair = await auditRepository.repairChainIntegrity(tenantId, auditIds);

    res.json({
      success: true,
      message: 'Chain integrity repair completed',
      data: repair
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Repair chain integrity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Generate integrity report
 * GET /working/audit/integrity/report
 */
router.get('/audit/integrity/report', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const report = await auditRepository.generateIntegrityReport(tenantId);

    res.json({
      success: true,
      message: 'Integrity report generated successfully',
      data: report
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Generate integrity report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// SEARCH & ANALYTICS
// ===========================

/**
 * Search audit entries
 * GET /working/audit/search
 */
router.get('/audit/search', jwtAuth, async (req: AuthenticatedRequest, res) => {
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

    const results = await auditRepository.search(tenantId, query, {
      templateType: req.query.templateType as any,
      auditType: req.query.auditType as any,
      category: req.query.category as any
    });

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        results,
        query,
        count: results.length
      }
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Search audit entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get retention status
 * GET /working/audit/retention/status
 */
router.get('/audit/retention/status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const status = await auditRepository.getRetentionStatus(tenantId);

    res.json({
      success: true,
      message: 'Retention status retrieved successfully',
      data: status
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Get retention status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get performance metrics
 * GET /working/audit/performance/metrics
 */
router.get('/audit/performance/metrics', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let timeRange;
    if (req.query.startDate && req.query.endDate) {
      timeRange = {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string)
      };
    }

    const metrics = await auditRepository.getPerformanceMetrics(tenantId, timeRange);

    res.json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: metrics
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Health check for audit repository
 * GET /working/audit/health
 */
router.get('/audit/health', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const health = await auditRepository.healthCheck();

    res.json({
      success: true,
      message: 'Audit system health check completed',
      data: health
    });

  } catch (error) {
    console.error('[TEMPLATE-AUDIT-WORKING] Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Log successful routes mounting
console.log('[TEMPLATE-AUDIT-WORKING] Phase 23 working routes initialized with Clean Architecture');

export default router;