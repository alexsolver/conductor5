// ✅ 1QA.MD COMPLIANCE: SLA WORKFLOW ROUTES
// HTTP endpoints for SLA workflow automation

import { Router } from 'express';
import { SlaWorkflowController } from '../application/controllers/SlaWorkflowController';

const router = Router();
const slaWorkflowController = new SlaWorkflowController();

// Workflow CRUD operations
router.post('/workflows', (req, res) => slaWorkflowController.createWorkflow(req, res));
router.get('/workflows', (req, res) => slaWorkflowController.getWorkflows(req, res));
router.get('/workflows/:id', (req, res) => slaWorkflowController.getWorkflow(req, res));
router.put('/workflows/:id', (req, res) => slaWorkflowController.updateWorkflow(req, res));
router.delete('/workflows/:id', (req, res) => slaWorkflowController.deleteWorkflow(req, res));

// Workflow execution
router.post('/workflows/:id/execute', (req, res) => slaWorkflowController.executeWorkflow(req, res));
router.get('/workflows/:id/executions', (req, res) => slaWorkflowController.getWorkflowExecutions(req, res));
router.get('/workflows/:id/stats', (req, res) => slaWorkflowController.getWorkflowStats(req, res));

// Active triggers management
router.get('/triggers/active', (req, res) => slaWorkflowController.getActiveTriggers(req, res));

export default router;