
import { Router } from 'express';
import { PartsServicesRepositoryEtapa4 } from '../infrastructure/repositories/PartsServicesRepositoryEtapa4';
import { PartsServicesControllerEtapa4 } from '../application/controllers/PartsServicesControllerEtapa4';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();
const repository = new PartsServicesRepositoryEtapa4();
const controller = new PartsServicesControllerEtapa4(repository);

// Apply JWT authentication to all routes
router.use(jwtAuth);

// ===== WORK ORDERS AUTOMÁTICOS =====
router.post('/work-orders', controller.createWorkOrder);
router.get('/work-orders', controller.getWorkOrders);
router.put('/work-orders/:workOrderId/status', controller.updateWorkOrderStatus);

// ===== INTEGRAÇÕES EXTERNAS =====
router.post('/integrations', controller.createExternalIntegration);
router.get('/integrations', controller.getExternalIntegrations);
router.post('/integrations/:integrationId/sync', controller.syncExternalIntegration);
router.get('/sync-logs', controller.getSyncLogs);

// ===== CONTRATOS COM FORNECEDORES =====
router.post('/supplier-contracts', controller.createSupplierContract);
router.get('/supplier-contracts', controller.getSupplierContracts);
router.post('/contract-items', controller.addContractItem);
router.get('/supplier-contracts/:contractId/items', controller.getContractItems);

// ===== APROVAÇÕES =====
router.get('/pending-approvals', controller.getPendingApprovals);

// ===== RELATÓRIOS EXECUTIVOS =====
router.post('/executive-reports', controller.createExecutiveReport);
router.get('/executive-reports', controller.getExecutiveReports);

// ===== KPIs DE FORNECEDORES =====
router.post('/supplier-kpis/generate', controller.generateSupplierKPIs);
router.get('/supplier-kpis', controller.getSupplierKPIs);

// ===== DASHBOARD E ANALYTICS =====
router.get('/analytics/integration', controller.getIntegrationAnalytics);

// ===== AUTOMAÇÃO E WORKFLOW =====
router.post('/automation/execute', controller.executeWorkflowAutomation);

export default router;
