// ✅ 1QA.MD COMPLIANCE: SLA WORKFLOW ROUTES
// HTTP endpoints for SLA workflow automation

import { Router } from 'express';
import { SlaWorkflowController } from '../application/controllers/SlaWorkflowController';

const router = Router();
const slaWorkflowController = new SlaWorkflowController();

// SLA Workflow routes
router.get('/', slaWorkflowController.getWorkflows.bind(slaWorkflowController));
router.post('/', slaWorkflowController.createWorkflow.bind(slaWorkflowController));
router.get('/:id', slaWorkflowController.getWorkflow.bind(slaWorkflowController));
router.put('/:id', slaWorkflowController.updateWorkflow.bind(slaWorkflowController));
router.delete('/:id', slaWorkflowController.deleteWorkflow.bind(slaWorkflowController));
router.post('/:id/execute', slaWorkflowController.executeWorkflow.bind(slaWorkflowController));
router.get('/:id/executions', slaWorkflowController.getWorkflowExecutions.bind(slaWorkflowController));
router.get('/:id/stats', slaWorkflowController.getWorkflowStats.bind(slaWorkflowController));
router.get('/triggers/active', slaWorkflowController.getActiveTriggers.bind(slaWorkflowController));

export { router as slaWorkflowRoutes };