import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';

// Repositories
import { DrizzleChatbotBotRepository } from './infrastructure/repositories/DrizzleChatbotBotRepository';
import { DrizzleChatbotFlowRepository } from './infrastructure/repositories/DrizzleChatbotFlowRepository';
import { DrizzleChatbotNodeRepository } from './infrastructure/repositories/DrizzleChatbotNodeRepository';
import { DrizzleChatbotEdgeRepository } from './infrastructure/repositories/DrizzleChatbotEdgeRepository';
import { DrizzleChatbotExecutionRepository } from './infrastructure/repositories/DrizzleChatbotExecutionRepository';

// Use Cases
import { CreateChatbotBotUseCase } from './application/use-cases/CreateChatbotBotUseCase';
import { GetChatbotBotsUseCase } from './application/use-cases/GetChatbotBotsUseCase';
import { GetChatbotBotByIdUseCase } from './application/use-cases/GetChatbotBotByIdUseCase';
import { UpdateChatbotBotUseCase } from './application/use-cases/UpdateChatbotBotUseCase';
import { DeleteChatbotBotUseCase } from './application/use-cases/DeleteChatbotBotUseCase';
import { ToggleChatbotBotUseCase } from './application/use-cases/ToggleChatbotBotUseCase';
import { CreateChatbotFlowUseCase } from './application/use-cases/CreateChatbotFlowUseCase';
import { GetChatbotFlowsUseCase } from './application/use-cases/GetChatbotFlowsUseCase';
import { GetChatbotFlowByIdUseCase } from './application/use-cases/GetChatbotFlowByIdUseCase';
import { UpdateChatbotFlowUseCase } from './application/use-cases/UpdateChatbotFlowUseCase';
import { DeleteChatbotFlowUseCase } from './application/use-cases/DeleteChatbotFlowUseCase';
import { CreateChatbotNodeUseCase } from './application/use-cases/CreateChatbotNodeUseCase';
import { UpdateChatbotNodeUseCase } from './application/use-cases/UpdateChatbotNodeUseCase';
import { DeleteChatbotNodeUseCase } from './application/use-cases/DeleteChatbotNodeUseCase';
import { CreateChatbotEdgeUseCase } from './application/use-cases/CreateChatbotEdgeUseCase';
import { DeleteChatbotEdgeUseCase } from './application/use-cases/DeleteChatbotEdgeUseCase';
import { ProcessChatbotMessageUseCase } from './application/use-cases/ProcessChatbotMessageUseCase';

// Controller
import { ChatbotController } from './application/controllers/ChatbotController';

const router = Router();

// Initialize repositories
const botRepository = new DrizzleChatbotBotRepository();
const flowRepository = new DrizzleChatbotFlowRepository();
const nodeRepository = new DrizzleChatbotNodeRepository();
const edgeRepository = new DrizzleChatbotEdgeRepository();
const executionRepository = new DrizzleChatbotExecutionRepository();

// Initialize use cases
const createBotUseCase = new CreateChatbotBotUseCase(botRepository);
const getBotsUseCase = new GetChatbotBotsUseCase(botRepository);
const getBotByIdUseCase = new GetChatbotBotByIdUseCase(botRepository);
const updateBotUseCase = new UpdateChatbotBotUseCase(botRepository);
const deleteBotUseCase = new DeleteChatbotBotUseCase(botRepository);
const toggleBotUseCase = new ToggleChatbotBotUseCase(botRepository);

const createFlowUseCase = new CreateChatbotFlowUseCase(flowRepository);
const getFlowsUseCase = new GetChatbotFlowsUseCase(flowRepository, botRepository);
const getFlowByIdUseCase = new GetChatbotFlowByIdUseCase(flowRepository);
const updateFlowUseCase = new UpdateChatbotFlowUseCase(flowRepository);
const deleteFlowUseCase = new DeleteChatbotFlowUseCase(flowRepository);

const createNodeUseCase = new CreateChatbotNodeUseCase(nodeRepository);
const updateNodeUseCase = new UpdateChatbotNodeUseCase(nodeRepository);
const deleteNodeUseCase = new DeleteChatbotNodeUseCase(nodeRepository);

const createEdgeUseCase = new CreateChatbotEdgeUseCase(edgeRepository);
const deleteEdgeUseCase = new DeleteChatbotEdgeUseCase(edgeRepository);

const processMessageUseCase = new ProcessChatbotMessageUseCase(
  botRepository,
  flowRepository,
  nodeRepository,
  edgeRepository,
  executionRepository
);

// Initialize controller with all dependencies
const chatbotController = new ChatbotController(
  createBotUseCase,
  getBotsUseCase,
  getBotByIdUseCase,
  updateBotUseCase,
  deleteBotUseCase,
  toggleBotUseCase,
  createFlowUseCase,
  getFlowsUseCase,
  getFlowByIdUseCase,
  updateFlowUseCase,
  deleteFlowUseCase,
  createNodeUseCase,
  updateNodeUseCase,
  deleteNodeUseCase,
  createEdgeUseCase,
  deleteEdgeUseCase,
  processMessageUseCase
);

// ===== BOT MANAGEMENT ROUTES =====

// Get all bots for tenant
router.get('/chatbots', jwtAuth, chatbotController.getBots.bind(chatbotController));

// Create new bot
router.post('/chatbots', jwtAuth, chatbotController.createBot.bind(chatbotController));

// Get specific bot
router.get('/chatbots/:botId', jwtAuth, chatbotController.getBot.bind(chatbotController));

// Update bot
router.put('/chatbots/:botId', jwtAuth, chatbotController.updateBot.bind(chatbotController));

// Delete bot
router.delete('/chatbots/:botId', jwtAuth, chatbotController.deleteBot.bind(chatbotController));

// Toggle bot active status
router.post('/chatbots/:botId/toggle', jwtAuth, chatbotController.toggleBot.bind(chatbotController));

// ===== FLOW MANAGEMENT ROUTES =====

// Get all flows for a bot
router.get('/chatbots/:botId/flows', jwtAuth, chatbotController.getFlows.bind(chatbotController));

// Create new flow for a bot
router.post('/chatbots/:botId/flows', jwtAuth, chatbotController.createFlow.bind(chatbotController));

// Get specific flow
router.get('/flows/:flowId', jwtAuth, chatbotController.getFlow.bind(chatbotController));

// Update flow
router.put('/flows/:flowId', jwtAuth, chatbotController.updateFlow.bind(chatbotController));

// Delete flow
router.delete('/flows/:flowId', jwtAuth, chatbotController.deleteFlow.bind(chatbotController));

// ===== NODE MANAGEMENT ROUTES =====

// Create node in flow
router.post('/flows/:flowId/nodes', jwtAuth, chatbotController.createNode.bind(chatbotController));

// Update node
router.put('/nodes/:nodeId', jwtAuth, chatbotController.updateNode.bind(chatbotController));

// Delete node
router.delete('/nodes/:nodeId', jwtAuth, chatbotController.deleteNode.bind(chatbotController));

// ===== EDGE MANAGEMENT ROUTES =====

// Create edge in flow
router.post('/flows/:flowId/edges', jwtAuth, chatbotController.createEdge.bind(chatbotController));

// Delete edge
router.delete('/edges/:edgeId', jwtAuth, chatbotController.deleteEdge.bind(chatbotController));

// ===== MESSAGE PROCESSING ROUTES =====

// Process incoming message through chatbot system
router.post('/chatbots/process-message', jwtAuth, chatbotController.processMessage.bind(chatbotController));

// ===== EXECUTION MANAGEMENT ROUTES =====

// Get execution details
router.get('/executions/:executionId', jwtAuth, chatbotController.getExecution.bind(chatbotController));

// Cancel running execution
router.post('/executions/:executionId/cancel', jwtAuth, chatbotController.cancelExecution.bind(chatbotController));

// ===== ANALYTICS ROUTES =====

// Get analytics for specific bot
router.get('/chatbots/:botId/analytics', jwtAuth, chatbotController.getBotAnalytics.bind(chatbotController));

// Get tenant-level analytics
router.get('/chatbots/analytics/tenant', jwtAuth, chatbotController.getTenantAnalytics.bind(chatbotController));

// ===== VALIDATION ROUTES =====

// Validate flow configuration
router.post('/flows/:flowId/validate', jwtAuth, chatbotController.validateFlow.bind(chatbotController));

export { router as chatbotRoutes };