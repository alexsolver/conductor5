import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// Temporary AI Agents routes - standalone implementation
// This avoids conflicts with existing OmniBridge system

// Mock data for now - will be connected to real database later
const mockAgents = [
  {
    id: '1',
    name: 'Assistente de Suporte',
    description: 'Agente especializado em atendimento ao cliente',
    isActive: true,
    supportedChannels: ['email', 'whatsapp'],
    availableActions: ['send_auto_reply', 'create_ticket'],
    personality: {
      tone: 'friendly',
      language: 'pt-BR',
      greeting: 'Olá! Como posso ajudar você hoje?',
      fallbackMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?'
    },
    escalationConfig: {
      escalateAfterSteps: 5,
      escalateToUsers: [],
      escalateKeywords: ['falar com humano', 'atendente']
    },
    menuConfig: {
      enabled: true,
      maxOptions: 5,
      timeoutMinutes: 10,
      showNumbers: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockConversations = [
  {
    id: '1',
    agentId: '1',
    userId: 'user1',
    channelType: 'email',
    status: 'active',
    currentStep: 'greeting',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Get all AI agents
router.get('/agents', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockAgents
    });
  } catch (error) {
    console.error('[AI-AGENTS] Error getting agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI agents'
    });
  }
});

// Get agent metrics
router.get('/agents/metrics', jwtAuth, async (req, res) => {
  try {
    const metrics = {
      totalConversations: 156,
      activeConversations: 23,
      completedConversations: 125,
      escalatedConversations: 8,
      avgResolutionTime: 15.5,
      successRate: 94.2,
      actionsExecuted: 1247
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('[AI-AGENTS] Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent metrics'
    });
  }
});

// Get conversations
router.get('/conversations', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockConversations
    });
  } catch (error) {
    console.error('[AI-AGENTS] Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
});

// Create new AI agent
router.post('/agents', jwtAuth, async (req, res) => {
  try {
    const agentData = req.body;
    
    // Create new agent with generated ID
    const newAgent = {
      id: Date.now().toString(),
      ...agentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock data (in real implementation, save to database)
    mockAgents.push(newAgent);

    res.json({
      success: true,
      data: newAgent,
      message: 'AI agent created successfully'
    });
  } catch (error) {
    console.error('[AI-AGENTS] Error creating agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create AI agent'
    });
  }
});

// Update AI agent
router.put('/agents/:id', jwtAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find and update agent in mock data
    const agentIndex = mockAgents.findIndex(agent => agent.id === id);
    if (agentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    mockAgents[agentIndex] = {
      ...mockAgents[agentIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockAgents[agentIndex],
      message: 'AI agent updated successfully'
    });
  } catch (error) {
    console.error('[AI-AGENTS] Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AI agent'
    });
  }
});

// Delete AI agent
router.delete('/agents/:id', jwtAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Remove from mock data
    const agentIndex = mockAgents.findIndex(agent => agent.id === id);
    if (agentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    mockAgents.splice(agentIndex, 1);

    res.json({
      success: true,
      message: 'AI agent deleted successfully'
    });
  } catch (error) {
    console.error('[AI-AGENTS] Error deleting agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete AI agent'
    });
  }
});

export { router as aiAgentsRoutes };