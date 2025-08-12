/**
 * Template Versions Working Routes
 * Clean Architecture - Presentation Layer
 * 
 * @module TemplateVersionsWorkingRoutes
 * @created 2025-08-12 - Phase 24 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

// Domain
import { SimplifiedTemplateVersionRepository } from './infrastructure/repositories/SimplifiedTemplateVersionRepository';

// Application
import { CreateVersionUseCase } from './application/use-cases/CreateVersionUseCase';
import { GetVersionHistoryUseCase } from './application/use-cases/GetVersionHistoryUseCase';
import { TemplateVersionController } from './application/controllers/TemplateVersionController';

const router = Router();

// Initialize repository
const versionRepository = new SimplifiedTemplateVersionRepository();

// Initialize use cases
const createVersionUseCase = new CreateVersionUseCase(versionRepository);
const getVersionHistoryUseCase = new GetVersionHistoryUseCase(versionRepository);

// Initialize controller
const versionController = new TemplateVersionController(
  createVersionUseCase,
  getVersionHistoryUseCase
);

/**
 * Working status endpoint
 * GET /working/status
 */
router.get('/status', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Template Versions working routes are operational',
      phase: 24,
      module: 'template-versions',
      status: 'working',
      architecture: 'Clean Architecture',
      layers: {
        domain: 'TemplateVersion entities and business rules',
        application: 'Use cases and controllers',
        infrastructure: 'Repository implementations',
        presentation: 'HTTP routes and responses'
      },
      features: {
        versionControl: 'Semantic version control with automated numbering',
        versionHistory: 'Complete version history and timeline tracking',
        versionComparison: 'Advanced version comparison and diff analysis',
        approvalWorkflows: 'Multi-stage approval workflows with notifications',
        migrationManagement: 'Automated migration planning and execution',
        qualityMetrics: 'Comprehensive quality scoring and monitoring',
        assetManagement: 'Version-specific asset storage and optimization',
        changelogGeneration: 'Automated changelog generation and management',
        backupRecovery: 'Version backup and recovery capabilities',
        analyticsReporting: 'Advanced analytics and performance reporting'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed'
    });
  }
});

// ===========================
// VERSION MANAGEMENT
// ===========================

/**
 * Create new template version
 * POST /working/versions
 */
router.post('/versions', jwtAuth, versionController.createVersion);

/**
 * Get specific version by ID
 * GET /working/versions/:id
 */
router.get('/versions/:id', jwtAuth, versionController.getVersion);

/**
 * Update version
 * PUT /working/versions/:id
 */
router.put('/versions/:id', jwtAuth, versionController.updateVersion);

/**
 * Get all versions for current tenant
 * GET /working/versions
 */
router.get('/versions', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const versions = await versionRepository.findAll(tenantId, {
      templateId: req.query.templateId as string,
      templateType: req.query.templateType as any,
      status: req.query.status as any,
      authorId: req.query.authorId as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
      isDeprecated: req.query.isDeprecated === 'true' ? true : req.query.isDeprecated === 'false' ? false : undefined,
      createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
      createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined
    });

    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    const paginatedVersions = versions.slice(offset, offset + limit);

    res.json({
      success: true,
      message: 'Versions retrieved successfully',
      data: {
        versions: paginatedVersions,
        pagination: {
          total: versions.length,
          page,
          limit,
          pages: Math.ceil(versions.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Get versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// VERSION HISTORY & ANALYTICS
// ===========================

/**
 * Get version history for specific template
 * GET /working/versions/history/:templateId
 */
router.get('/versions/history/:templateId', jwtAuth, versionController.getTemplateHistory);

/**
 * Get all version history (across templates)
 * GET /working/versions/history
 */
router.get('/versions/history', jwtAuth, versionController.getAllVersionHistory);

/**
 * Get version statistics
 * GET /working/versions/statistics
 */
router.get('/versions/statistics', jwtAuth, versionController.getVersionStatistics);

/**
 * Get version analytics
 * GET /working/versions/analytics
 */
router.get('/versions/analytics', jwtAuth, versionController.getVersionAnalytics);

// ===========================
// VERSION OPERATIONS
// ===========================

/**
 * Publish version
 * POST /working/versions/:id/publish
 */
router.post('/versions/:id/publish', jwtAuth, versionController.publishVersion);

/**
 * Deprecate version
 * POST /working/versions/:id/deprecate
 */
router.post('/versions/:id/deprecate', jwtAuth, versionController.deprecateVersion);

/**
 * Clone version
 * POST /working/versions/:id/clone
 */
router.post('/versions/:id/clone', jwtAuth, versionController.cloneVersion);

/**
 * Compare two versions
 * GET /working/versions/compare/:id1/:id2
 */
router.get('/versions/compare/:id1/:id2', jwtAuth, versionController.compareVersions);

// ===========================
// TEMPLATE-SPECIFIC OPERATIONS
// ===========================

/**
 * Get latest version for template
 * GET /working/templates/:templateId/latest
 */
router.get('/templates/:templateId/latest', jwtAuth, async (req: AuthenticatedRequest, res) => {
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

    const latestVersion = await versionRepository.findLatestVersion(tenantId, templateId);

    if (!latestVersion) {
      return res.status(404).json({
        success: false,
        message: 'No versions found for this template'
      });
    }

    res.json({
      success: true,
      message: 'Latest version retrieved successfully',
      data: latestVersion
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Get latest version error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get published versions for template
 * GET /working/templates/:templateId/published
 */
router.get('/templates/:templateId/published', jwtAuth, async (req: AuthenticatedRequest, res) => {
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

    const publishedVersions = await versionRepository.findPublishedVersions(tenantId, templateId);

    res.json({
      success: true,
      message: 'Published versions retrieved successfully',
      data: {
        versions: publishedVersions,
        count: publishedVersions.length
      }
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Get published versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get version by version number
 * GET /working/templates/:templateId/versions/:versionNumber
 */
router.get('/templates/:templateId/versions/:versionNumber', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const templateId = req.params.templateId;
    const versionNumber = req.params.versionNumber;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const version = await versionRepository.findByVersionNumber(tenantId, templateId, versionNumber);

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    res.json({
      success: true,
      message: 'Version retrieved successfully',
      data: version
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Get version by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// MIGRATION MANAGEMENT
// ===========================

/**
 * Create migration plan
 * POST /working/versions/migration/plan
 */
router.post('/versions/migration/plan', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const { fromVersionId, toVersionId } = req.body;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!fromVersionId || !toVersionId) {
      return res.status(400).json({
        success: false,
        message: 'From version ID and to version ID are required'
      });
    }

    const migrationPlan = await versionRepository.createMigrationPlan(tenantId, fromVersionId, toVersionId);

    res.json({
      success: true,
      message: 'Migration plan created successfully',
      data: migrationPlan
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Create migration plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Execute migration
 * POST /working/versions/migration/execute
 */
router.post('/versions/migration/execute', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const { migrationId, dryRun, backupFirst, validateAfter } = req.body;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Permission check for migration execution
    if (!['saas_admin', 'tenant_admin', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to execute migrations'
      });
    }

    if (!migrationId) {
      return res.status(400).json({
        success: false,
        message: 'Migration ID is required'
      });
    }

    const migrationResult = await versionRepository.executeMigration(tenantId, migrationId, {
      dryRun,
      backupFirst,
      validateAfter
    });

    res.json({
      success: true,
      message: 'Migration executed successfully',
      data: migrationResult
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Execute migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get migration status
 * GET /working/versions/migration/:migrationId/status
 */
router.get('/versions/migration/:migrationId/status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const migrationId = req.params.migrationId;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const migrationStatus = await versionRepository.getMigrationStatus(tenantId, migrationId);

    res.json({
      success: true,
      message: 'Migration status retrieved successfully',
      data: migrationStatus
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Get migration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// QUALITY & PERFORMANCE
// ===========================

/**
 * Run quality checks
 * POST /working/versions/:id/quality/check
 */
router.post('/versions/:id/quality/check', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const versionId = req.params.id;
    const { includeSecurityScan, includePerformanceTest, includeAccessibilityAudit, includeComplianceCheck } = req.body;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const qualityResults = await versionRepository.runQualityChecks(tenantId, versionId, {
      includeSecurityScan,
      includePerformanceTest,
      includeAccessibilityAudit,
      includeComplianceCheck
    });

    res.json({
      success: true,
      message: 'Quality checks completed successfully',
      data: qualityResults
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Run quality checks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get quality score
 * GET /working/versions/:id/quality/score
 */
router.get('/versions/:id/quality/score', jwtAuth, async (req: AuthenticatedRequest, res) => {
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

    const qualityScore = await versionRepository.getQualityScore(tenantId, versionId);

    res.json({
      success: true,
      message: 'Quality score retrieved successfully',
      data: qualityScore
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Get quality score error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Analyze performance
 * GET /working/versions/:id/performance/analyze
 */
router.get('/versions/:id/performance/analyze', jwtAuth, async (req: AuthenticatedRequest, res) => {
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

    const performanceAnalysis = await versionRepository.analyzePerformance(tenantId, versionId);

    res.json({
      success: true,
      message: 'Performance analysis completed successfully',
      data: performanceAnalysis
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Analyze performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// CHANGELOG MANAGEMENT
// ===========================

/**
 * Get changelog for template
 * GET /working/templates/:templateId/changelog
 */
router.get('/templates/:templateId/changelog', jwtAuth, async (req: AuthenticatedRequest, res) => {
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

    const changelog = await versionRepository.getChangelog(tenantId, templateId, {
      fromVersion: req.query.fromVersion as string,
      toVersion: req.query.toVersion as string,
      includeBreakingChanges: req.query.includeBreakingChanges === 'true',
      groupByType: req.query.groupByType === 'true',
      format: req.query.format as 'detailed' | 'summary'
    });

    res.json({
      success: true,
      message: 'Changelog retrieved successfully',
      data: changelog
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Get changelog error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Generate changelog between versions
 * POST /working/versions/changelog/generate
 */
router.post('/versions/changelog/generate', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;
    const { fromVersionId, toVersionId } = req.body;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!fromVersionId || !toVersionId) {
      return res.status(400).json({
        success: false,
        message: 'From version ID and to version ID are required'
      });
    }

    const generatedChangelog = await versionRepository.generateChangelog(tenantId, fromVersionId, toVersionId);

    res.json({
      success: true,
      message: 'Changelog generated successfully',
      data: generatedChangelog
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Generate changelog error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// SYSTEM MONITORING
// ===========================

/**
 * Health check for version repository
 * GET /working/versions/health
 */
router.get('/versions/health', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const health = await versionRepository.healthCheck();

    res.json({
      success: true,
      message: 'Version system health check completed',
      data: health
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get system metrics
 * GET /working/versions/system/metrics
 */
router.get('/versions/system/metrics', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Permission check for system metrics access
    if (!['saas_admin', 'tenant_admin', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access system metrics'
      });
    }

    const systemMetrics = await versionRepository.getSystemMetrics();

    res.json({
      success: true,
      message: 'System metrics retrieved successfully',
      data: systemMetrics
    });

  } catch (error) {
    console.error('[TEMPLATE-VERSIONS-WORKING] Get system metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Log successful routes mounting
console.log('[TEMPLATE-VERSIONS-WORKING] Phase 24 working routes initialized with Clean Architecture');

export default router;