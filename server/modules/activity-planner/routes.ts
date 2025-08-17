/**
 * Activity Planner Routes - Rotas do módulo de planejamento de atividades
 * Define endpoints REST para gerenciamento de ativos, planos e ordens de serviço
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { AssetController } from './application/controllers/AssetController';
import { AssetApplicationService } from './application/services/AssetApplicationService';
import { DrizzleAssetRepository } from './infrastructure/repositories/DrizzleAssetRepository';

const router = Router();

// Inicializar dependências seguindo Clean Architecture
const assetRepository = new DrizzleAssetRepository();
const assetApplicationService = new AssetApplicationService(assetRepository);
const assetController = new AssetController(assetApplicationService);

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);

// === ASSETS ROUTES ===

// Criar ativo
router.post('/assets', (req, res) => assetController.createAsset(req, res));

// Listar ativos (com filtros e paginação)
router.get('/assets', (req, res) => assetController.getAssets(req, res));

// Obter ativo por ID
router.get('/assets/:id', (req, res) => assetController.getAssetById(req, res));

// Atualizar ativo
router.put('/assets/:id', (req, res) => assetController.updateAsset(req, res));

// Deletar/desativar ativo
router.delete('/assets/:id', (req, res) => assetController.deleteAsset(req, res));

// Obter hierarquia do ativo
router.get('/assets/:id/hierarchy', (req, res) => assetController.getAssetHierarchy(req, res));

// Atualizar medidor do ativo
router.put('/assets/:id/meter', (req, res) => assetController.updateAssetMeter(req, res));

// Estatísticas de ativos
router.get('/stats/assets', (req, res) => assetController.getAssetStats(req, res));

// Ativos que precisam de manutenção
router.get('/assets/maintenance/needed', (req, res) => assetController.getAssetsNeedingMaintenance(req, res));

// === MAINTENANCE PLANS ROUTES ===

// Inicializar dependências para MaintenancePlan
import { MaintenancePlanApplicationService } from './application/services/MaintenancePlanApplicationService';
import { MaintenancePlanController } from './application/controllers/MaintenancePlanController';
import { DrizzleMaintenancePlanRepository } from './infrastructure/repositories/DrizzleMaintenancePlanRepository';

const maintenancePlanRepository = new DrizzleMaintenancePlanRepository();
const maintenancePlanApplicationService = new MaintenancePlanApplicationService(maintenancePlanRepository, assetRepository);
const maintenancePlanController = new MaintenancePlanController(maintenancePlanApplicationService);

// Criar plano de manutenção
router.post('/maintenance-plans', (req, res) => maintenancePlanController.createMaintenancePlan(req, res));

// Listar planos de manutenção
router.get('/maintenance-plans', (req, res) => maintenancePlanController.getMaintenancePlans(req, res));

// Obter plano por ID
router.get('/maintenance-plans/:id', (req, res) => maintenancePlanController.getMaintenancePlanById(req, res));

// Obter planos por ativo
router.get('/assets/:assetId/maintenance-plans', (req, res) => maintenancePlanController.getMaintenancePlansByAsset(req, res));

// Atualizar plano
router.put('/maintenance-plans/:id', (req, res) => maintenancePlanController.updateMaintenancePlan(req, res));

// Deletar plano
router.delete('/maintenance-plans/:id', (req, res) => maintenancePlanController.deleteMaintenancePlan(req, res));

// Ativar plano
router.put('/maintenance-plans/:id/activate', (req, res) => maintenancePlanController.activateMaintenancePlan(req, res));

// Desativar plano
router.put('/maintenance-plans/:id/deactivate', (req, res) => maintenancePlanController.deactivateMaintenancePlan(req, res));

// Gerar ordem de serviço a partir do plano
router.post('/maintenance-plans/:id/generate', (req, res) => maintenancePlanController.generateWorkOrder(req, res));

// Listar planos que precisam gerar OS
router.get('/maintenance-plans/generation/needed', (req, res) => maintenancePlanController.getPlansNeedingGeneration(req, res));

// Processar geração programada
router.post('/maintenance-plans/generation/process', (req, res) => maintenancePlanController.processScheduledGeneration(req, res));

// Estatísticas de planos
router.get('/stats/maintenance-plans', (req, res) => maintenancePlanController.getMaintenancePlanStatistics(req, res));

// === WORK ORDERS ROUTES ===

// Inicializar dependências para WorkOrder
import { WorkOrderApplicationService } from './application/services/WorkOrderApplicationService';
import { WorkOrderController } from './application/controllers/WorkOrderController';
import { DrizzleWorkOrderRepository } from './infrastructure/repositories/DrizzleWorkOrderRepository';

const workOrderRepository = new DrizzleWorkOrderRepository();
const workOrderApplicationService = new WorkOrderApplicationService(workOrderRepository, assetRepository, maintenancePlanRepository);
const workOrderController = new WorkOrderController(workOrderApplicationService);

// Criar ordem de serviço
router.post('/work-orders', (req, res) => workOrderController.createWorkOrder(req, res));

// Listar ordens de serviço
router.get('/work-orders', (req, res) => workOrderController.getWorkOrders(req, res));

// Obter ordem por ID
router.get('/work-orders/:id', (req, res) => workOrderController.getWorkOrderById(req, res));

// Obter ordens por ativo
router.get('/assets/:assetId/work-orders', (req, res) => workOrderController.getWorkOrdersByAsset(req, res));

// Atualizar ordem
router.put('/work-orders/:id', (req, res) => workOrderController.updateWorkOrder(req, res));

// Deletar ordem
router.delete('/work-orders/:id', (req, res) => workOrderController.deleteWorkOrder(req, res));

// Atualizar status
router.put('/work-orders/:id/status', (req, res) => workOrderController.updateWorkOrderStatus(req, res));

// Atualizar progresso
router.put('/work-orders/:id/progress', (req, res) => workOrderController.updateWorkOrderProgress(req, res));

// Agendar ordem
router.put('/work-orders/:id/schedule', (req, res) => workOrderController.scheduleWorkOrder(req, res));

// Atribuir técnico
router.put('/work-orders/:id/assign-technician', (req, res) => workOrderController.assignTechnician(req, res));

// Iniciar ordem
router.post('/work-orders/:id/start', (req, res) => workOrderController.startWorkOrder(req, res));

// Finalizar ordem
router.post('/work-orders/:id/complete', (req, res) => workOrderController.completeWorkOrder(req, res));

// Ordens atrasadas
router.get('/work-orders/overdue/list', (req, res) => workOrderController.getOverdueWorkOrders(req, res));

// Estatísticas de ordens
router.get('/stats/work-orders', (req, res) => workOrderController.getWorkOrderStatistics(req, res));

// Métricas do dashboard
router.get('/dashboard/work-orders', (req, res) => workOrderController.getDashboardMetrics(req, res));

// // Criar ordem de serviço
// router.post('/work-orders', (req, res) => workOrderController.createWorkOrder(req, res));

// // Listar ordens de serviço
// router.get('/work-orders', (req, res) => workOrderController.getWorkOrders(req, res));

// // Obter ordem de serviço por ID
// router.get('/work-orders/:id', (req, res) => workOrderController.getWorkOrderById(req, res));

// // Atualizar ordem de serviço
// router.put('/work-orders/:id', (req, res) => workOrderController.updateWorkOrder(req, res));

// // Iniciar execução da OS
// router.put('/work-orders/:id/start', (req, res) => workOrderController.startWorkOrder(req, res));

// // Pausar OS
// router.put('/work-orders/:id/pause', (req, res) => workOrderController.pauseWorkOrder(req, res));

// // Completar OS
// router.put('/work-orders/:id/complete', (req, res) => workOrderController.completeWorkOrder(req, res));

// // Cancelar OS
// router.put('/work-orders/:id/cancel', (req, res) => workOrderController.cancelWorkOrder(req, res));

// // Agendar OS
// router.post('/work-orders/:id/schedule', (req, res) => workOrderController.scheduleWorkOrder(req, res));

// // Listar tarefas da OS
// router.get('/work-orders/:id/tasks', (req, res) => workOrderController.getWorkOrderTasks(req, res));

// // Executar checklist de tarefa
// router.post('/tasks/:id/checklist', (req, res) => workOrderController.executeTaskChecklist(req, res));

// // Anexar evidências
// router.post('/tasks/:id/evidence', (req, res) => workOrderController.attachTaskEvidence(req, res));

// // Atualizar status da tarefa
// router.put('/tasks/:id/status', (req, res) => workOrderController.updateTaskStatus(req, res));

// === SCHEDULING ROUTES ===
// TODO: Implementar quando ScheduleController estiver pronto

// // Obter agenda consolidada
// router.get('/schedule', (req, res) => scheduleController.getSchedule(req, res));

// // Otimizar programação
// router.post('/schedule/optimize', (req, res) => scheduleController.optimizeSchedule(req, res));

// // Listar técnicos
// router.get('/technicians', (req, res) => scheduleController.getTechnicians(req, res));

// // Criar/configurar turnos
// router.post('/shifts', (req, res) => scheduleController.createShift(req, res));

// === PARTS & INVENTORY INTEGRATION ===
// TODO: Implementar integração com materials-services

// // Reservar peças
// router.post('/parts/reserve', (req, res) => partsController.reserveParts(req, res));

// // Consumir peças
// router.post('/parts/consume', (req, res) => partsController.consumeParts(req, res));

// // Verificar disponibilidade
// router.get('/parts/availability', (req, res) => partsController.checkAvailability(req, res));

// === ANALYTICS & KPIs ===
// TODO: Implementar quando AnalyticsController estiver pronto

// // Métricas consolidadas
// router.get('/kpis/maintenance', (req, res) => analyticsController.getMaintenanceKPIs(req, res));

// // Relatório SLA
// router.get('/reports/sla', (req, res) => analyticsController.getSLAReport(req, res));

// // Indicadores técnicos
// router.get('/reports/mttr-mtbf', (req, res) => analyticsController.getTechnicalIndicators(req, res));

// // Análise de falhas (Pareto)
// router.get('/reports/pareto', (req, res) => analyticsController.getParetoAnalysis(req, res));

console.log('✅ [ActivityPlannerRoutes] Activity Planner routes initialized');

export default router;