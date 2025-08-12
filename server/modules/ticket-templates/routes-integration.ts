/**
 * Ticket Templates Integration Routes - Phase 20 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for ticket template management system
 * 
 * @module TicketTemplatesIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import ticketTemplatesWorkingRoutes from './routes-working';

const router = Router();

/**
 * Phase 20 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'ticket-templates-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 20,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 20 working implementation for ticket template management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 20 status',
        'GET /working/templates - List all templates',
        'GET /working/templates/:id - Get template details',
        'POST /working/templates - Create new template',
        'PUT /working/templates/:id - Update template',
        'DELETE /working/templates/:id - Delete template',
        'GET /working/categories - Get template categories',
        'GET /working/category/:category - Get templates by category',
        'GET /working/defaults - Get default templates',
        'GET /working/popular - Get popular templates',
        'GET /working/search - Search templates',
        'GET /working/templates/:id/analytics - Get template analytics',
        'GET /working/usage/statistics - Get usage statistics',
        'GET /working/fields/analytics - Get field analytics',
        'POST /working/templates/:id/feedback - Add user feedback',
        'GET /working/templates/:id/feedback - Get template feedback',
        'POST /working/templates/:id/use - Increment usage count',
        'GET /working/templates/:id/performance - Get performance metrics',
        'POST /working/templates/:id/clone - Clone template'
      ]
    },
    features: {
      templateManagement: true,
      automation: true,
      workflow: true,
      fieldTypes: true,
      templateTypes: true,
      permissions: true,
      analytics: true,
      searchAndFilter: true,
      userFeedback: true,
      cleanArchitecture: true,
      multiTenancy: true,
      authentication: true,
      templateValidation: true,
      fieldManagement: true,
      templateVersioning: true,
      autoAssignment: true,
      autoTagging: true,
      statusAutomation: true,
      notifications: true,
      escalationRules: true,
      slaManagement: true,
      workflowStages: true,
      approvalProcess: true,
      stageTransitions: true,
      workflowConditions: true,
      basicFields: true,
      advancedValidation: true,
      conditionalLogic: true,
      dynamicOptions: true,
      roleBasedAccess: true,
      templateOwnership: true,
      permissionManagement: true,
      accessControl: true,
      usageStatistics: true,
      performanceMetrics: true,
      fieldAnalytics: true,
      popularityTracking: true,
      templateSearch: true,
      categoryFiltering: true,
      typeFiltering: true,
      tagBasedSearch: true,
      ratingSystem: true,
      feedbackCollection: true,
      averageRatings: true,
      feedbackAnalytics: true
    },
    cleanArchitecture: {
      domainLayer: {
        entities: [
          'TicketTemplate',
          'TicketTemplateField',
          'TicketTemplateAutomation',
          'TicketTemplateWorkflow',
          'TicketTemplatePermission',
          'TicketTemplateMetadata'
        ],
        services: ['TicketTemplateDomainService'],
        repositories: ['ITicketTemplateRepository']
      },
      applicationLayer: {
        controllers: ['TicketTemplateController'],
        useCases: [
          'CreateTicketTemplateUseCase',
          'GetTicketTemplatesUseCase',
          'UpdateTicketTemplateUseCase'
        ]
      },
      infrastructureLayer: {
        repositories: ['SimplifiedTicketTemplateRepository']
      }
    },
    businessLogic: {
      templateManagement: 'Complete ticket template management with dynamic fields and validation',
      automationSystem: 'Advanced automation system with auto-assignment, escalation, and SLA management',
      workflowEngine: 'Workflow engine with stages, approvals, and conditional transitions',
      permissionSystem: 'Role-based permission system for template access and management',
      analyticsEngine: 'Comprehensive analytics with usage tracking and performance metrics',
      feedbackSystem: 'User feedback system for continuous template improvement'
    },
    supportedFeatures: {
      fieldTypes: ['text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'url'],
      templateTypes: ['standard', 'quick', 'escalation', 'auto_response', 'workflow'],
      automationTypes: ['auto_assign', 'auto_tags', 'auto_status', 'notifications', 'escalation', 'sla'],
      validationTypes: ['required', 'minLength', 'maxLength', 'pattern', 'customValidator'],
      permissionLevels: ['view', 'use', 'edit', 'delete', 'manage'],
      workflowFeatures: ['stages', 'approvals', 'conditions', 'transitions', 'auto_advance']
    },
    templateLimits: {
      maxFieldsPerTemplate: 50,
      maxAutomationRules: 20,
      maxWorkflowStages: 10,
      maxApprovalSteps: 5,
      maxTagsPerTemplate: 20
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
    phase: 20,
    module: 'ticket-templates',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: {
      templateManagement: 'operational',
      automationSystem: 'operational',
      workflowEngine: 'operational',
      analyticsEngine: 'operational',
      feedbackSystem: 'operational'
    }
  });
});

// ===== WORKING PHASE 20 ROUTES (PRIMARY) =====

/**
 * Mount Phase 20 working routes as primary system
 * All routes use the Phase 20 implementation with Clean Architecture
 */
try {
  console.log('[TICKET-TEMPLATES-INTEGRATION] Mounting Phase 20 working routes at /working');
  router.use('/working', ticketTemplatesWorkingRoutes);
} catch (error) {
  console.error('[TICKET-TEMPLATES-INTEGRATION] Error mounting Phase 20 working routes:', error);
}

export default router;