/**
 * Template Hierarchy Working Routes - Phase 19 Implementation
 * 
 * Working implementation for Phase 19 completion
 * Uses Clean Architecture with Use Cases and Controllers
 * 
 * @module TemplateHierarchyWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TemplateHierarchyController } from './application/controllers/TemplateHierarchyController';
import { CreateTemplateHierarchyUseCase } from './application/use-cases/CreateTemplateHierarchyUseCase';
import { GetTemplateHierarchyUseCase } from './application/use-cases/GetTemplateHierarchyUseCase';
import { UpdateTemplateHierarchyUseCase } from './application/use-cases/UpdateTemplateHierarchyUseCase';
import { SimplifiedTemplateHierarchyRepository } from './infrastructure/repositories/SimplifiedTemplateHierarchyRepository';

const router = Router();

// Initialize repository and use cases
const templateHierarchyRepository = new SimplifiedTemplateHierarchyRepository();
const createTemplateHierarchyUseCase = new CreateTemplateHierarchyUseCase(templateHierarchyRepository);
const getTemplateHierarchyUseCase = new GetTemplateHierarchyUseCase(templateHierarchyRepository);
const updateTemplateHierarchyUseCase = new UpdateTemplateHierarchyUseCase(templateHierarchyRepository);

// Initialize controller
const templateHierarchyController = new TemplateHierarchyController(
  createTemplateHierarchyUseCase,
  getTemplateHierarchyUseCase,
  updateTemplateHierarchyUseCase
);

// Apply middleware
router.use(jwtAuth);

/**
 * Phase 19 Status Endpoint
 * GET /working/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    phase: 19,
    module: 'template-hierarchy',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      templates: {
        list: 'GET /working/templates',
        get: 'GET /working/templates/:id',
        create: 'POST /working/templates',
        update: 'PUT /working/templates/:id',
        delete: 'DELETE /working/templates/:id'
      },
      hierarchy: {
        get: 'GET /working/templates/:id/hierarchy',
        categories: 'GET /working/categories',
        byCategory: 'GET /working/category/:category',
        roots: 'GET /working/roots'
      },
      search: 'GET /working/search',
      inheritance: 'GET /working/templates/:id/resolved',
      audit: 'GET /working/templates/:id/audit',
      usage: 'GET /working/usage/statistics'
    },
    features: {
      templateManagement: {
        crudOperations: true,
        hierarchicalStructure: true,
        inheritanceSystem: true,
        templateValidation: true
      },
      hierarchyManagement: {
        parentChildRelationships: true,
        hierarchyNavigation: true,
        pathResolution: true,
        levelManagement: true
      },
      inheritanceSystem: {
        fieldInheritance: true,
        validationInheritance: true,
        styleInheritance: true,
        permissionInheritance: true,
        overrideModes: true,
        lockedFields: true
      },
      templateStructure: {
        dynamicFields: true,
        sectionManagement: true,
        validationRules: true,
        conditionalLogic: true,
        templateStyles: true,
        templateScripts: true
      },
      permissionSystem: {
        roleBasedAccess: true,
        permissionManagement: true,
        templateOwnership: true,
        accessControl: true
      },
      auditTrail: {
        changeTracking: true,
        auditLog: true,
        versionHistory: true,
        userTracking: true
      },
      searchAndFilter: {
        templateSearch: true,
        categoryFiltering: true,
        hierarchyFiltering: true,
        tagBasedSearch: true
      },
      usageAnalytics: {
        usageStatistics: true,
        popularTemplates: true,
        categoryAnalytics: true,
        levelAnalytics: true
      },
      cleanArchitecture: {
        domainEntities: true,
        useCases: true,
        repositories: true,
        controllers: true
      },
      multiTenancy: true,
      authentication: true
    },
    businessRules: {
      inheritanceLogic: 'Templates inherit from parent templates with configurable override modes',
      hierarchyValidation: 'Validates hierarchy integrity and prevents circular dependencies',
      permissionEnforcement: 'Role-based access control for template operations',
      templateValidation: 'Comprehensive validation of template structure and data',
      auditCompliance: 'Complete audit trail for all template operations'
    },
    supportedCategories: ['tickets', 'forms', 'workflows', 'reports', 'dashboards'],
    supportedFieldTypes: ['text', 'number', 'email', 'phone', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'textarea', 'file', 'url'],
    inheritanceModes: ['merge', 'replace', 'extend'],
    maxHierarchyDepth: 10,
    timestamp: new Date().toISOString()
  });
});

// ===== TEMPLATE CRUD ROUTES =====

/**
 * Get all templates or filter by query params
 * GET /working/templates
 */
router.get('/templates', templateHierarchyController.getTemplates);

/**
 * Get specific template by ID
 * GET /working/templates/:id
 */
router.get('/templates/:id', templateHierarchyController.getTemplates);

/**
 * Create new template
 * POST /working/templates
 */
router.post('/templates', templateHierarchyController.createTemplate);

/**
 * Update existing template
 * PUT /working/templates/:id
 */
router.put('/templates/:id', templateHierarchyController.updateTemplate);

/**
 * Delete template
 * DELETE /working/templates/:id
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const template = await templateHierarchyRepository.findById(templateId, tenantId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if template has children
    const children = await templateHierarchyRepository.findChildren(templateId, tenantId);
    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete template with child templates'
      });
    }

    const deleted = await templateHierarchyRepository.delete(templateId, tenantId);
    
    if (deleted) {
      // Add audit entry
      await templateHierarchyRepository.addAuditEntry(templateId, tenantId, {
        action: 'deleted',
        userId: req.user?.id || 'unknown',
        userName: req.user?.email || 'unknown',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });
    }

    return res.json({
      success: deleted,
      message: deleted ? 'Template deleted successfully' : 'Failed to delete template'
    });

  } catch (error) {
    console.error('[TemplateHierarchyWorkingRoutes] deleteTemplate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== HIERARCHY NAVIGATION ROUTES =====

/**
 * Get template hierarchy (ancestors, descendants, siblings)
 * GET /working/templates/:id/hierarchy
 */
router.get('/templates/:id/hierarchy', templateHierarchyController.getTemplateHierarchy);

/**
 * Get all template categories
 * GET /working/categories
 */
router.get('/categories', templateHierarchyController.getCategories);

/**
 * Get templates by category
 * GET /working/category/:category
 */
router.get('/category/:category', templateHierarchyController.getTemplatesByCategory);

/**
 * Get root templates (level 0)
 * GET /working/roots
 */
router.get('/roots', templateHierarchyController.getRootTemplates);

// ===== SEARCH AND FILTER ROUTES =====

/**
 * Search templates
 * GET /working/search
 */
router.get('/search', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const query = req.query.q as string;

    if (!tenantId) {
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

    const filters = {
      category: req.query.category as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      author: req.query.author as string,
      level: req.query.level ? parseInt(req.query.level as string) : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const templates = await templateHierarchyRepository.search(
      tenantId,
      query,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        templates,
        query,
        filters,
        count: templates.length
      }
    });

  } catch (error) {
    console.error('[TemplateHierarchyWorkingRoutes] search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== INHERITANCE AND RESOLUTION ROUTES =====

/**
 * Get resolved template with inheritance applied
 * GET /working/templates/:id/resolved
 */
router.get('/templates/:id/resolved', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resolvedTemplate = await templateHierarchyRepository.getResolvedTemplate(templateId, tenantId);

    return res.json({
      success: true,
      message: 'Resolved template retrieved successfully',
      data: resolvedTemplate
    });

  } catch (error) {
    console.error('[TemplateHierarchyWorkingRoutes] getResolvedTemplate error:', error);
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }
});

// ===== AUDIT AND HISTORY ROUTES =====

/**
 * Get template audit trail
 * GET /working/templates/:id/audit
 */
router.get('/templates/:id/audit', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const auditTrail = await templateHierarchyRepository.getAuditTrail(templateId, tenantId, limit);

    return res.json({
      success: true,
      message: 'Audit trail retrieved successfully',
      data: auditTrail
    });

  } catch (error) {
    console.error('[TemplateHierarchyWorkingRoutes] getAuditTrail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== USAGE ANALYTICS ROUTES =====

/**
 * Get usage statistics
 * GET /working/usage/statistics
 */
router.get('/usage/statistics', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const statistics = await templateHierarchyRepository.getUsageStatistics(tenantId);

    return res.json({
      success: true,
      message: 'Usage statistics retrieved successfully',
      data: statistics
    });

  } catch (error) {
    console.error('[TemplateHierarchyWorkingRoutes] getUsageStatistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== UTILITY ROUTES =====

/**
 * Increment template usage count
 * POST /working/templates/:id/use
 */
router.post('/templates/:id/use', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const incremented = await templateHierarchyRepository.incrementUsageCount(templateId, tenantId);

    return res.json({
      success: incremented,
      message: incremented ? 'Usage count incremented' : 'Template not found'
    });

  } catch (error) {
    console.error('[TemplateHierarchyWorkingRoutes] incrementUsage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;