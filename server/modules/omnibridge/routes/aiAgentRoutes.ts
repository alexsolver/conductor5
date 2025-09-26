import { Router } from 'express';
import { AiAgentController } from '../application/controllers/AiAgentController';
import { DrizzleAiAgentRepository } from '../infrastructure/repositories/DrizzleAiAgentRepository';
import { ConversationalAgentEngine } from '../infrastructure/services/ConversationalAgentEngine';
import { ActionExecutor } from '../infrastructure/services/ActionExecutor';
import { AIAnalysisService } from '../infrastructure/services/AIAnalysisService';

export function createAiAgentRoutes(): Router {
  const router = Router();

  // Inicializar dependências
  const agentRepository = new DrizzleAiAgentRepository();
  
  // Usar serviços existentes
  const actionExecutor = new ActionExecutor();
  const aiService = new AIAnalysisService();
  
  // Criar motor conversacional
  const conversationEngine = new ConversationalAgentEngine(
    agentRepository,
    actionExecutor,
    aiService
  );

  // Inicializar controlador
  const aiAgentController = new AiAgentController(agentRepository, conversationEngine);

  // Rotas para gerenciamento de agentes
  router.post('/agents', (req, res) => aiAgentController.createAgent(req, res));
  router.get('/agents', (req, res) => aiAgentController.getAgents(req, res));
  router.get('/agents/:id', (req, res) => aiAgentController.getAgent(req, res));
  router.put('/agents/:id', (req, res) => aiAgentController.updateAgent(req, res));
  router.delete('/agents/:id', (req, res) => aiAgentController.deleteAgent(req, res));

  // Rota para processamento de mensagens (conversação)
  router.post('/agents/conversation', (req, res) => aiAgentController.processMessage(req, res));

  console.log('🤖 [AiAgentRoutes] AI Agent routes configured');

  return router;
}
import { Router } from 'express';
import { jwtAuth } from '../../../middleware/jwtAuth';
import { AiAgentController } from '../application/controllers/AiAgentController';
import { DrizzleAiAgentRepository } from '../infrastructure/repositories/DrizzleAiAgentRepository';
import { ConversationalAgentEngine } from '../infrastructure/services/ConversationalAgentEngine';

export function createAiAgentRoutes(): Router {
  const router = Router();
  
  // Repositories and services
  const agentRepository = new DrizzleAiAgentRepository();
  const conversationEngine = new ConversationalAgentEngine();
  
  // Controller
  const aiAgentController = new AiAgentController(agentRepository, conversationEngine);
  
  // Routes
  router.get('/agents', jwtAuth, (req, res) => aiAgentController.getAgents(req, res));
  router.post('/agents', jwtAuth, (req, res) => aiAgentController.createAgent(req, res));
  router.get('/agents/:id', jwtAuth, (req, res) => aiAgentController.getAgent(req, res));
  router.put('/agents/:id', jwtAuth, (req, res) => aiAgentController.updateAgent(req, res));
  router.delete('/agents/:id', jwtAuth, (req, res) => aiAgentController.deleteAgent(req, res));
  router.post('/agents/process', jwtAuth, (req, res) => aiAgentController.processMessage(req, res));
  
  // Debug route
  router.get('/debug/agents', jwtAuth, async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }
      
      console.log(`🔧 [AI-AGENTS-DEBUG] Checking agents for tenant: ${tenantId}`);
      
      const agents = await agentRepository.findByTenantId(tenantId);
      
      console.log(`📋 [AI-AGENTS-DEBUG] Found ${agents.length} agents:`, agents);
      
      return res.json({
        success: true,
        count: agents.length,
        agents: agents,
        tenant: tenantId
      });
    } catch (error) {
      console.error(`❌ [AI-AGENTS-DEBUG] Error:`, error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return router;
}
