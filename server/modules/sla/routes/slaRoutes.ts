// ✅ 1QA.MD COMPLIANCE: SLA ROUTES
// Clean Architecture routes for SLA module

import { Router, Request, Response } from 'express';
import { SlaController } from '../application/controllers/SlaController';
import { jwtAuth, AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { slaService } from '../../../services/SlaService'; // Assuming slaService is imported here

const router = Router();
const slaController = new SlaController();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// ===== SLA DEFINITIONS =====
router.get('/definitions', slaController.getSlaDefinitions.bind(slaController));
router.get('/definitions/:id', slaController.getSlaDefinitionById.bind(slaController));
router.post('/definitions', slaController.createSlaDefinition.bind(slaController));
router.put('/definitions/:id', slaController.updateSlaDefinition.bind(slaController));
router.delete('/definitions/:id', slaController.deleteSlaDefinition.bind(slaController));

// ===== SLA INSTANCES =====
router.get('/instances/ticket/:ticketId', slaController.getSlaInstancesByTicket.bind(slaController));
router.get('/instances/active', slaController.getActiveSlaInstances.bind(slaController));
router.get('/instances/breached', slaController.getBreachedSlaInstances.bind(slaController));

// ===== SLA VIOLATIONS =====
router.get('/violations', slaController.getSlaViolations.bind(slaController));

// ===== SLA ANALYTICS =====
router.get('/analytics/compliance', slaController.getSlaComplianceStats.bind(slaController));
router.get('/analytics/performance', slaController.getSlaPerformanceMetrics.bind(slaController));

// ===== SLA MONITORING =====
// Check SLA breaches
router.post('/monitoring/check-breaches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const breachedInstances = await slaService.checkSlaBreaches(req.tenantId!);

    res.json({
      success: true,
      data: breachedInstances,
      total: breachedInstances.length
    });
  } catch (error) {
    console.error('Error checking SLA breaches:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking SLA breaches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== SLA WORKFLOWS =====

// Get all SLA workflows
router.get('/workflows', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflows = await slaService.getSlaWorkflows(req.tenantId!);

    res.json({
      success: true,
      data: workflows,
      total: workflows.length
    });
  } catch (error) {
    console.error('Error fetching SLA workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SLA workflows',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create SLA workflow
router.post('/workflows', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflowData = {
      ...req.body,
      tenantId: req.tenantId
    };

    const workflow = await slaService.createSlaWorkflow(workflowData);

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'SLA workflow created successfully'
    });
  } catch (error) {
    console.error('Error creating SLA workflow:', error);
    res.status(400).json({
      success: false,
      message: `Workflow validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Update SLA workflow
router.put('/workflows/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = await slaService.updateSlaWorkflow(id, req.tenantId!, req.body);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'SLA workflow not found'
      });
    }

    res.json({
      success: true,
      data: workflow,
      message: 'SLA workflow updated successfully'
    });
  } catch (error) {
    console.error('Error updating SLA workflow:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating SLA workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete SLA workflow
router.delete('/workflows/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await slaService.deleteSlaWorkflow(id, req.tenantId!);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'SLA workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'SLA workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SLA workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting SLA workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as slaRoutes };