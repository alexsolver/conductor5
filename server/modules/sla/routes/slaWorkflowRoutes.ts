// ✅ 1QA.MD COMPLIANCE: SLA WORKFLOW ROUTES
// HTTP endpoints for SLA workflow automation

import { Router } from 'express';
import { SlaWorkflowController } from '../application/controllers/SlaWorkflowController';
import { DrizzleSlaWorkflowRepository } from '../infrastructure/repositories/DrizzleSlaWorkflowRepository';

const router = Router();

// Initialize with error handling
try {
  const slaWorkflowRepository = new DrizzleSlaWorkflowRepository();
  const slaWorkflowController = new SlaWorkflowController(slaWorkflowRepository);

  router.get('/', slaWorkflowController.getWorkflows.bind(slaWorkflowController));
  router.post('/', slaWorkflowController.createWorkflow.bind(slaWorkflowController));
} catch (error) {
  console.error('[SlaWorkflowRoutes] Error initializing routes:', error);

  // Fallback error handler
  router.get('/', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'SLA Workflow service is temporarily unavailable',
      error: 'Service initialization failed'
    });
  });
}

export { router as slaWorkflowRoutes };