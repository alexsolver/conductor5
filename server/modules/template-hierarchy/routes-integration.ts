/**
 * Template Hierarchy Integration Routes - Phase 19 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for template hierarchy management system
 * 
 * @module TemplateHierarchyIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 19 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import templateHierarchyWorkingRoutes from './routes-working';

const router = Router();

/**
 * Phase 19 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'template-hierarchy-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 19,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 19 working implementation for template hierarchy management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 19 status',
        'GET /working/templates - List all templates',
        'GET /working/templates/:id - Get template details',
        'POST /working/templates - Create new template',
        'PUT /working/templates/:id - Update template',
        'DELETE /working/templates/:id - Delete template',
        'GET /working/templates/:id/hierarchy - Get template hierarchy',
        'GET /working/categories - Get template categories',
        'GET /working/category/:category - Get templates by category',
        'GET /working/roots - Get root templates',
        'GET /working/search - Search templates',
        'GET /working/templates/:id/resolved - Get resolved template',
        'GET /working/templates/:id/audit - Get audit trail',
        'GET /working/usage/statistics - Get usage statistics',
        'POST /working/templates/:id/use - Increment usage count'
      ]
    },
    features: {
      templateManagement: true,
      hierarchyManagement: true,
      inheritanceSystem: true,
      templateStructure: true,
      permissionSystem: true,
      auditTrail: true,
      searchAndFilter: true,
      usageAnalytics: true,
      cleanArchitecture: true,
      multiTenancy: true,
      authentication: true,
      dynamicFields: true,
      sectionManagement: true,
      validationRules: true,
      conditionalLogic: true,
      templateStyles: true,
      roleBasedAccess: true,
      changeTracking: true,
      templateSearch: true,
      categoryManagement: true,
      hierarchyNavigation: true,
      inheritanceResolution: true,
      templateValidation: true,
      auditCompliance: true
    },
    cleanArchitecture: {
      domainLayer: {
        entities: [
          'TemplateHierarchy',
          'InheritanceRules',
          'TemplateMetadata',
          'TemplateStructure',
          'TemplateField',
          'TemplateSection',
          'TemplateValidation'
        ],
        services: ['TemplateHierarchyDomainService'],
        repositories: ['ITemplateHierarchyRepository']
      },
      applicationLayer: {
        controllers: ['TemplateHierarchyController'],
        useCases: [
          'CreateTemplateHierarchyUseCase',
          'GetTemplateHierarchyUseCase',
          'UpdateTemplateHierarchyUseCase'
        ]
      },
      infrastructureLayer: {
        repositories: ['SimplifiedTemplateHierarchyRepository']
      }
    },
    businessLogic: {
      templateHierarchy: 'Complete hierarchical template system with parent-child relationships and inheritance',
      inheritanceSystem: 'Advanced inheritance with field, validation, style, and permission inheritance modes',
      templateManagement: 'Full CRUD operations for templates with validation and structure management',
      permissionSystem: 'Role-based access control for template operations and hierarchy management',
      auditTrail: 'Complete audit trail for all template operations and changes',
      searchAndFilter: 'Advanced search capabilities with category, tag, and hierarchy filtering'
    },
    supportedFeatures: {
      categories: ['tickets', 'forms', 'workflows', 'reports', 'dashboards'],
      fieldTypes: ['text', 'number', 'email', 'phone', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'textarea', 'file', 'url'],
      inheritanceModes: ['merge', 'replace', 'extend'],
      validationTypes: ['required', 'min', 'max', 'pattern', 'custom'],
      layouts: ['single_column', 'two_column', 'grid', 'tabs'],
      permissionLevels: ['view', 'edit', 'delete', 'create_child', 'manage_permissions']
    },
    hierarchyLimits: {
      maxDepth: 10,
      maxChildrenPerTemplate: 50,
      maxFieldsPerTemplate: 100,
      maxSectionsPerTemplate: 20
    },
    lastUpdated: new Date().toISOString()
  });
});

/**
 * Health Check Endpoint
 * GET /health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    phase: 19,
    module: 'template-hierarchy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: {
      templateHierarchy: 'operational',
      inheritanceSystem: 'operational',
      searchAndFilter: 'operational',
      auditTrail: 'operational'
    }
  });
});

// ===== WORKING PHASE 19 ROUTES (PRIMARY) =====

/**
 * Mount Phase 19 working routes as primary system
 * All routes use the Phase 19 implementation with Clean Architecture
 */
try {
  console.log('[TEMPLATE-HIERARCHY-INTEGRATION] Mounting Phase 19 working routes at /working');
  router.use('/working', templateHierarchyWorkingRoutes);
} catch (error) {
  console.error('[TEMPLATE-HIERARCHY-INTEGRATION] Error mounting Phase 19 working routes:', error);
}

export default router;