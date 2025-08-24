/**
 * Ticket Templates Working Routes - Phase 20 Implementation
 * 
 * Working implementation for Phase 20 completion
 * Uses Clean Architecture with Use Cases and Controllers
 * 
 * @module TicketTemplatesWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 20 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TicketTemplateController } from './application/controllers/TicketTemplateController';
import { CreateTicketTemplateUseCase } from './application/use-cases/CreateTicketTemplateUseCase';
import { GetTicketTemplatesUseCase } from './application/use-cases/GetTicketTemplatesUseCase';
import { UpdateTicketTemplateUseCase } from './application/use-cases/UpdateTicketTemplateUseCase';
import { SimplifiedTicketTemplateRepository } from './infrastructure/repositories/SimplifiedTicketTemplateRepository';

const router = Router();

// Initialize repository and use cases
const ticketTemplateRepository = new SimplifiedTicketTemplateRepository();
const createTicketTemplateUseCase = new CreateTicketTemplateUseCase(ticketTemplateRepository);
const getTicketTemplatesUseCase = new GetTicketTemplatesUseCase(ticketTemplateRepository);
const updateTicketTemplateUseCase = new UpdateTicketTemplateUseCase(ticketTemplateRepository);

// Initialize controller
const ticketTemplateController = new TicketTemplateController(
  createTicketTemplateUseCase,
  getTicketTemplatesUseCase,
  updateTicketTemplateUseCase
);

// Apply middleware
router.use(jwtAuth);

/**
 * Phase 20 Status Endpoint
 * GET /working/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    phase: 20,
    module: 'ticket-templates',
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
      categories: {
        list: 'GET /working/categories',
        byCategory: 'GET /working/category/:category'
      },
      specialTemplates: {
        defaults: 'GET /working/defaults',
        popular: 'GET /working/popular'
      },
      analytics: {
        template: 'GET /working/templates/:id/analytics',
        usage: 'GET /working/usage/statistics',
        fields: 'GET /working/fields/analytics'
      },
      search: 'GET /working/search',
      feedback: {
        add: 'POST /working/templates/:id/feedback',
        get: 'GET /working/templates/:id/feedback'
      },
      usage: 'POST /working/templates/:id/use'
    },
    features: {
      templateManagement: {
        crudOperations: true,
        templateValidation: true,
        fieldManagement: true,
        templateVersioning: true
      },
      automation: {
        autoAssignment: true,
        autoTagging: true,
        statusAutomation: true,
        notifications: true,
        escalationRules: true,
        slaManagement: true
      },
      workflow: {
        workflowStages: true,
        approvalProcess: true,
        stageTransitions: true,
        workflowConditions: true
      },
      fieldTypes: {
        basicFields: true,
        advancedValidation: true,
        conditionalLogic: true,
        dynamicOptions: true
      },
      templateTypes: {
        standard: true,
        quick: true,
        escalation: true,
        autoResponse: true,
        workflow: true
      },
      permissions: {
        roleBasedAccess: true,
        templateOwnership: true,
        permissionManagement: true,
        accessControl: true
      },
      analytics: {
        usageStatistics: true,
        performanceMetrics: true,
        fieldAnalytics: true,
        popularityTracking: true
      },
      searchAndFilter: {
        templateSearch: true,
        categoryFiltering: true,
        typeFiltering: true,
        tagBasedSearch: true
      },
      userFeedback: {
        ratingSystem: true,
        feedbackCollection: true,
        averageRatings: true,
        feedbackAnalytics: true
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
      templateValidation: 'Templates are validated for field consistency and business rules',
      automationRules: 'Automation rules are validated for logic and dependencies',
      permissionEnforcement: 'Role-based access control for all template operations',
      usageTracking: 'Complete usage tracking with analytics and performance metrics',
      feedbackSystem: 'User feedback system for continuous template improvement'
    },
    supportedFieldTypes: ['text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'url'],
    supportedTemplateTypes: ['standard', 'quick', 'escalation', 'auto_response', 'workflow'],
    supportedAutomation: ['auto_assign', 'auto_tags', 'auto_status', 'notifications', 'escalation', 'sla'],
    maxFieldsPerTemplate: 50,
    maxAutomationRules: 20,
    timestamp: new Date().toISOString()
  });
});

// ===== TEMPLATE CRUD ROUTES =====

/**
 * Get all templates or filter by query params
 * GET /working/templates
 */
router.get('/templates', ticketTemplateController.getTemplates);

/**
 * Get specific template by ID
 * GET /working/templates/:id
 */
router.get('/templates/:id', ticketTemplateController.getTemplates);

/**
 * Create new template
 * POST /working/templates
 */
router.post('/templates', ticketTemplateController.createTemplate);

/**
 * Update existing template
 * PUT /working/templates/:id
 */
router.put('/templates/:id', ticketTemplateController.updateTemplate);

/**
 * Delete template
 * DELETE /working/templates/:id
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;
    const userRole = req.user?.role;

    if (!tenantId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if template exists
    const template = await ticketTemplateRepository.findById(templateId, tenantId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permissions (basic check - in real implementation would use domain service)
    if (userRole !== 'admin' && userRole !== 'saas_admin' && template.createdBy !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete this template'
      });
    }

    // Check if template is in use (simplified check)
    if (template.usageCount > 0 && template.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default template that is in use'
      });
    }

    const deleted = await ticketTemplateRepository.delete(templateId, tenantId);

    return res.json({
      success: deleted,
      message: deleted ? 'Template deleted successfully' : 'Failed to delete template'
    });

  } catch (error) {
    console.error('[TicketTemplatesWorkingRoutes] deleteTemplate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== CATEGORY ROUTES =====

/**
 * Get all template categories
 * GET /working/categories
 */
router.get('/categories', ticketTemplateController.getCategories);

/**
 * Get templates by category
 * GET /working/category/:category
 */
router.get('/category/:category', ticketTemplateController.getTemplatesByCategory);

// ===== SPECIAL TEMPLATE ROUTES =====

/**
 * Get default templates
 * GET /working/defaults
 */
router.get('/defaults', ticketTemplateController.getDefaultTemplates);

/**
 * Get popular templates
 * GET /working/popular
 */
router.get('/popular', ticketTemplateController.getPopularTemplates);

// ===== SEARCH ROUTES =====

/**
 * Search templates
 * GET /working/search
 */
router.get('/search', async (req, res) => {
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

    const filters = {
      category: req.query.category as string,
      templateType: req.query.templateType as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const templates = await ticketTemplateRepository.search(
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
    console.error('[TicketTemplatesWorkingRoutes] search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== ANALYTICS ROUTES =====

/**
 * Get template analytics
 * GET /working/templates/:id/analytics
 */
router.get('/templates/:id/analytics', ticketTemplateController.getTemplateAnalytics);

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

    const statistics = await ticketTemplateRepository.getUsageStatistics(tenantId);

    return res.json({
      success: true,
      message: 'Usage statistics retrieved successfully',
      data: statistics
    });

  } catch (error) {
    console.error('[TicketTemplatesWorkingRoutes] getUsageStatistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get field analytics
 * GET /working/fields/analytics
 */
router.get('/fields/analytics', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const analytics = await ticketTemplateRepository.getFieldAnalytics(tenantId);

    return res.json({
      success: true,
      message: 'Field analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    console.error('[TicketTemplatesWorkingRoutes] getFieldAnalytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== USER FEEDBACK ROUTES =====

/**
 * Add user feedback to template
 * POST /working/templates/:id/feedback
 */
router.post('/templates/:id/feedback', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email;

    if (!tenantId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const feedback = await ticketTemplateRepository.addUserFeedback(templateId, tenantId, {
      userId,
      userName: userName || 'Unknown User',
      rating,
      comment
    });

    return res.json({
      success: true,
      message: 'Feedback added successfully',
      data: feedback
    });

  } catch (error) {
    console.error('[TicketTemplatesWorkingRoutes] addFeedback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get template feedback
 * GET /working/templates/:id/feedback
 */
router.get('/templates/:id/feedback', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const feedback = await ticketTemplateRepository.getUserFeedback(templateId, tenantId, limit);
    const averageRating = await ticketTemplateRepository.getAverageRating(templateId, tenantId);

    return res.json({
      success: true,
      message: 'Feedback retrieved successfully',
      data: {
        feedback,
        averageRating,
        totalFeedback: feedback.length
      }
    });

  } catch (error) {
    console.error('[TicketTemplatesWorkingRoutes] getFeedback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== USAGE TRACKING ROUTES =====

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

    const incremented = await ticketTemplateRepository.incrementUsageCount(templateId, tenantId);

    return res.json({
      success: incremented,
      message: incremented ? 'Usage count incremented' : 'Template not found'
    });

  } catch (error) {
    console.error('[TicketTemplatesWorkingRoutes] incrementUsage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== UTILITY ROUTES =====

/**
 * Get template performance metrics
 * GET /working/templates/:id/performance
 */
router.get('/templates/:id/performance', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const metrics = await ticketTemplateRepository.getPerformanceMetrics(templateId, tenantId);

    return res.json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: metrics
    });

  } catch (error) {
    console.error('[TicketTemplatesWorkingRoutes] getPerformanceMetrics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Clone template
 * POST /working/templates/:id/clone
 */
router.post('/templates/:id/clone', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const templateId = req.params.id;
    const userId = req.user?.id;
    const { name, companyId, includeAutomation, includeWorkflow } = req.body;

    if (!tenantId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }

    const clonedTemplate = await ticketTemplateRepository.cloneTemplate(templateId, tenantId, {
      name,
      companyId,
      clonedBy: userId,
      includeAutomation: includeAutomation !== false,
      includeWorkflow: includeWorkflow !== false
    });

    return res.json({
      success: true,
      message: 'Template cloned successfully',
      data: clonedTemplate
    });

  } catch (error) {
    console.error('[TicketTemplatesWorkingRoutes] cloneTemplate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;