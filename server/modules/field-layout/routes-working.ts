/**
 * Field Layout Working Routes
 * Clean Architecture - Presentation Layer
 * 
 * @module FieldLayoutWorkingRoutes
 * @created 2025-08-12 - Phase 21 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

// Domain
import { SimplifiedFieldLayoutRepository } from './infrastructure/repositories/SimplifiedFieldLayoutRepository';

// Application
import { CreateFieldLayoutUseCase } from './application/use-cases/CreateFieldLayoutUseCase';
import { GetFieldLayoutsUseCase } from './application/use-cases/GetFieldLayoutsUseCase';
import { FieldLayoutController } from './application/controllers/FieldLayoutController';

const router = Router();

// Initialize repository
const fieldLayoutRepository = new SimplifiedFieldLayoutRepository();

// Initialize use cases
const createFieldLayoutUseCase = new CreateFieldLayoutUseCase(fieldLayoutRepository);
const getFieldLayoutsUseCase = new GetFieldLayoutsUseCase(fieldLayoutRepository);

// Initialize controller
const fieldLayoutController = new FieldLayoutController(
  createFieldLayoutUseCase,
  getFieldLayoutsUseCase
);

/**
 * Working status endpoint
 * GET /working/status
 */
router.get('/status', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Field Layout working routes are operational',
      phase: 21,
      module: 'field-layout',
      status: 'working',
      architecture: 'Clean Architecture',
      layers: {
        domain: 'FieldLayout entities and business rules',
        application: 'Use cases and controllers',
        infrastructure: 'Repository implementations',
        presentation: 'HTTP routes and responses'
      },
      features: {
        layoutDesigner: 'Advanced layout designer with drag-and-drop',
        responsiveDesign: 'Mobile-first responsive layouts',
        fieldManagement: 'Dynamic field configuration',
        sectionManagement: 'Collapsible section organization',
        conditionalLogic: 'Field and section conditional display',
        validation: 'Comprehensive validation rules',
        performance: 'Performance optimization and caching',
        accessibility: 'WCAG compliance and screen reader support',
        templates: 'Layout templates and cloning',
        analytics: 'Usage analytics and performance metrics'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed'
    });
  }
});

// ===========================
// LAYOUT MANAGEMENT ROUTES
// ===========================

/**
 * Create new field layout
 * POST /working/layouts
 */
router.post('/layouts', jwtAuth, fieldLayoutController.createLayout);

/**
 * Get all layouts with filters
 * GET /working/layouts
 */
router.get('/layouts', jwtAuth, fieldLayoutController.getLayouts);

/**
 * Get specific layout by ID
 * GET /working/layouts/:id
 */
router.get('/layouts/:id', jwtAuth, fieldLayoutController.getLayouts);

/**
 * Get layouts by module
 * GET /working/module/:module
 */
router.get('/module/:module', jwtAuth, fieldLayoutController.getLayoutsByModule);

/**
 * Get default layouts
 * GET /working/defaults
 */
router.get('/defaults', jwtAuth, fieldLayoutController.getDefaultLayouts);

/**
 * Search layouts
 * GET /working/search
 */
router.get('/search', jwtAuth, fieldLayoutController.searchLayouts);

// ===========================
// LAYOUT ANALYTICS ROUTES
// ===========================

/**
 * Get layout analytics
 * GET /working/layouts/:id/analytics
 */
router.get('/layouts/:id/analytics', jwtAuth, fieldLayoutController.getLayoutAnalytics);

/**
 * Get layout performance metrics
 * GET /working/layouts/:id/performance
 */
router.get('/layouts/:id/performance', jwtAuth, fieldLayoutController.getLayoutPerformance);

/**
 * Get layout accessibility report
 * GET /working/layouts/:id/accessibility
 */
router.get('/layouts/:id/accessibility', jwtAuth, fieldLayoutController.getLayoutAccessibility);

// ===========================
// LAYOUT MANAGEMENT OPERATIONS
// ===========================

/**
 * Update layout
 * PUT /working/layouts/:id
 */
router.put('/layouts/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const layoutId = req.params.id;

    if (!tenantId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const updatedLayout = await fieldLayoutRepository.update(
      layoutId,
      tenantId,
      {
        ...req.body,
        metadata: {
          ...req.body.metadata,
          lastModifiedBy: userId,
          lastModifiedAt: new Date()
        }
      }
    );

    if (!updatedLayout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    res.json({
      success: true,
      message: 'Layout updated successfully',
      data: updatedLayout
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Update layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Delete layout
 * DELETE /working/layouts/:id
 */
router.delete('/layouts/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const layoutId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const deleted = await fieldLayoutRepository.delete(layoutId, tenantId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    res.json({
      success: true,
      message: 'Layout deleted successfully'
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Delete layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Clone layout
 * POST /working/layouts/:id/clone
 */
router.post('/layouts/:id/clone', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const sourceId = req.params.id;

    if (!tenantId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const clonedLayout = await fieldLayoutRepository.cloneLayout(
      sourceId,
      tenantId,
      {
        name: req.body.name || `Copy of Layout`,
        module: req.body.module,
        clonedBy: userId,
        includeSettings: req.body.includeSettings !== false,
        includeStyling: req.body.includeStyling !== false
      }
    );

    res.status(201).json({
      success: true,
      message: 'Layout cloned successfully',
      data: clonedLayout
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Clone layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// USAGE AND FEEDBACK ROUTES
// ===========================

/**
 * Increment layout usage
 * POST /working/layouts/:id/use
 */
router.post('/layouts/:id/use', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const layoutId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const success = await fieldLayoutRepository.incrementUsageCount(layoutId, tenantId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    res.json({
      success: true,
      message: 'Usage count updated'
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Increment usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Add layout feedback
 * POST /working/layouts/:id/feedback
 */
router.post('/layouts/:id/feedback', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Unknown User';
    const layoutId = req.params.id;

    if (!tenantId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const feedback = await fieldLayoutRepository.addLayoutFeedback(
      layoutId,
      tenantId,
      {
        userId,
        userName,
        rating: req.body.rating,
        comment: req.body.comment,
        category: req.body.category || 'usability'
      }
    );

    res.status(201).json({
      success: true,
      message: 'Feedback added successfully',
      data: feedback
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get layout feedback
 * GET /working/layouts/:id/feedback
 */
router.get('/layouts/:id/feedback', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const layoutId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const feedback = await fieldLayoutRepository.getLayoutFeedback(layoutId, tenantId, limit);
    const averageRating = await fieldLayoutRepository.getAverageRating(layoutId, tenantId);

    res.json({
      success: true,
      message: 'Feedback retrieved successfully',
      data: {
        feedback,
        averageRating,
        count: feedback.length
      }
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===========================
// SYSTEM INFORMATION ROUTES
// ===========================

/**
 * Get available modules
 * GET /working/modules
 */
router.get('/modules', jwtAuth, fieldLayoutController.getAvailableModules);

/**
 * Get usage statistics
 * GET /working/usage/statistics
 */
router.get('/usage/statistics', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const statistics = await fieldLayoutRepository.getUsageStatistics(tenantId);

    res.json({
      success: true,
      message: 'Usage statistics retrieved successfully',
      data: statistics
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Get usage statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get field analytics
 * GET /working/fields/analytics
 */
router.get('/fields/analytics', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const analytics = await fieldLayoutRepository.getFieldAnalytics(tenantId);

    res.json({
      success: true,
      message: 'Field analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Get field analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get responsive configuration
 * GET /working/layouts/:id/responsive
 */
router.get('/layouts/:id/responsive', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const layoutId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const responsiveConfig = await fieldLayoutRepository.getResponsiveConfig(layoutId, tenantId);

    res.json({
      success: true,
      message: 'Responsive configuration retrieved successfully',
      data: responsiveConfig
    });

  } catch (error) {
    console.error('[FIELD-LAYOUT-WORKING] Get responsive config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Log successful routes mounting
console.log('[FIELD-LAYOUT-WORKING] Phase 21 working routes initialized with Clean Architecture');

export default router;