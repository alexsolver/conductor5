// ✅ 1QA.MD COMPLIANCE: SLA ROUTES
// Clean Architecture routes for SLA module

import { Router } from 'express';
import { SlaController } from '../application/controllers/SlaController';
import { jwtAuth } from '../../../middleware/jwtAuth';

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
router.post('/monitoring/check-breaches', slaController.checkSlaBreaches.bind(slaController));

export { router as slaRoutes };