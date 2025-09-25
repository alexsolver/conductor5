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