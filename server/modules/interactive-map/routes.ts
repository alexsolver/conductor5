// ✅ 1QA.MD: Presentation Layer - HTTP routes and endpoint definitions
import express from 'express';
import { InteractiveMapController } from './application/controllers/InteractiveMapController';
import { GetFieldAgentsUseCase } from './application/use-cases/GetFieldAgentsUseCase';
import { UpdateAgentPositionUseCase } from './application/use-cases/UpdateAgentPositionUseCase';
import { GetAgentLocationHistoryUseCase } from './application/use-cases/GetAgentLocationHistoryUseCase';
import { DrizzleFieldAgentRepository } from './infrastructure/repositories/DrizzleFieldAgentRepository';

const router = express.Router();

// ✅ 1QA.MD: Dependency injection following Clean Architecture
const fieldAgentRepository = new DrizzleFieldAgentRepository();
const getFieldAgentsUseCase = new GetFieldAgentsUseCase(fieldAgentRepository);
const updateAgentPositionUseCase = new UpdateAgentPositionUseCase(fieldAgentRepository, fieldAgentRepository);
const getAgentLocationHistoryUseCase = new GetAgentLocationHistoryUseCase(fieldAgentRepository);

const controller = new InteractiveMapController(
  getFieldAgentsUseCase,
  updateAgentPositionUseCase,
  getAgentLocationHistoryUseCase
);

console.log('🗺️ [INTERACTIVE-MAP] Registering routes...');

// ✅ 1QA.MD: GET /agents - Retrieve field agents with filters
router.get('/agents', async (req, res) => {
  console.log('🗺️ [INTERACTIVE-MAP] === GET /agents ROUTE CALLED ===', {
    query: req.query,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  console.log('🗺️ [INTERACTIVE-MAP] Route middleware validation passed, calling controller...');
  await controller.getFieldAgents(req, res);
});

// ✅ 1QA.MD: POST /agents/:agentId/position - Update agent position
router.post('/agents/:agentId/position', async (req, res) => {
  console.log('🗺️ [INTERACTIVE-MAP] === POST /agents/:agentId/position ROUTE CALLED ===', {
    params: req.params,
    body: req.body,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  await controller.updateAgentPosition(req, res);
});

// ✅ 1QA.MD: GET /agents/:agentId/history - Get agent location history
router.get('/agents/:agentId/history', async (req, res) => {
  console.log('🗺️ [INTERACTIVE-MAP] === GET /agents/:agentId/history ROUTE CALLED ===', {
    params: req.params,
    query: req.query,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  await controller.getAgentLocationHistory(req, res);
});

// ✅ 1QA.MD: GET /config - Get map configuration
router.get('/config', async (req, res) => {
  console.log('🗺️ [INTERACTIVE-MAP] === GET /config ROUTE CALLED ===', {
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  await controller.getMapConfiguration(req, res);
});

console.log('🗺️ [INTERACTIVE-MAP] Routes registered successfully');

export { router as interactiveMapRoutes };