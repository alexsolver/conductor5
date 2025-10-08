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

  // Frontend compatibility routes (alias for frontend)
  router.get('/', (req, res) => aiAgentController.getAgents(req, res));
  router.post('/generate-config', (req, res) => {
    // Auto-generate configuration from natural language
    const { prompt } = req.body;
    res.json({
      success: true,
      config: {
        name: 'Agente Gerado',
        personality: {
          tone: 'profissional',
          language: 'pt-BR',
          greeting: 'Olá! Como posso ajudar?',
          fallbackMessage: 'Desculpe, não entendi. Pode reformular?',
          confirmationStyle: 'formal'
        },
        enabledActions: [],
        behaviorRules: {
          requireConfirmation: [],
          autoEscalateKeywords: ['urgente', 'crítico'],
          maxConversationTurns: 10,
          collectionStrategy: 'incremental',
          errorHandling: 'retry'
        },
        aiConfig: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: prompt || 'Você é um assistente útil.'
        }
      }
    });
  });
  
  router.get('/actions/available', (req, res) => {
    // Return available actions
    const availableActions = [
      {
        id: '1',
        actionType: 'create_ticket',
        name: 'Criar Ticket',
        description: 'Cria um novo ticket no sistema',
        category: 'Tickets',
        riskLevel: 'low'
      },
      {
        id: '2',
        actionType: 'update_ticket',
        name: 'Atualizar Ticket',
        description: 'Atualiza informações de um ticket existente',
        category: 'Tickets',
        riskLevel: 'medium'
      },
      {
        id: '3',
        actionType: 'send_message',
        name: 'Enviar Mensagem',
        description: 'Envia uma mensagem ao cliente',
        category: 'Comunicação',
        riskLevel: 'low'
      },
      {
        id: '4',
        actionType: 'escalate_to_human',
        name: 'Escalar para Humano',
        description: 'Transfere a conversa para um atendente humano',
        category: 'Escalação',
        riskLevel: 'low'
      },
      {
        id: '5',
        actionType: 'close_conversation',
        name: 'Encerrar Conversa',
        description: 'Finaliza a conversa com o cliente',
        category: 'Comunicação',
        riskLevel: 'medium'
      }
    ];
    
    res.json(availableActions);
  });

  console.log('🤖 [AiAgentRoutes] AI Agent routes configured');

  return router;
}