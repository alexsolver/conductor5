// ========================================
// AI AGENT ROUTES
// ========================================
// API routes for AI conversational agent system

import { Router } from 'express';
import type { Request, Response } from 'express';
import { jwtAuth, type AuthenticatedRequest } from '../middleware/jwtAuth';
import { unifiedStorage } from '../storage-master';
import { conversationManager } from '../services/conversation-manager';
import { insertAiAgentSchema, insertAiConversationFeedbackSchema } from '@shared/schema-ai-agent';
import { z } from 'zod';
import OpenAI from 'openai';

const router = Router();

// All routes require authentication
router.use(jwtAuth);

// ========================================
// AI AGENTS CRUD
// ========================================

/**
 * GET /api/ai-agents
 * List all AI agents for tenant
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const agents = await unifiedStorage.getAiAgents(tenantId);
    res.json(agents);
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    res.status(500).json({ error: 'Failed to fetch AI agents' });
  }
});

/**
 * GET /api/ai-agents/actions/available
 * List all available actions for AI agents
 * MUST be before /:id route to avoid being captured as an ID
 */
router.get('/actions/available', async (req: AuthenticatedRequest, res: Response) => {
  console.log('🔍 [AI-ACTIONS] /actions/available endpoint called by:', req.user?.email);
  try {
    let actions = await unifiedStorage.getAiActions();
    console.log(`📋 [AI-ACTIONS] Found ${actions.length} actions in database`);
    
    // Auto-seed if no actions exist
    if (actions.length === 0) {
      console.log('🌱 No actions found, seeding default actions...');
      const seedModule = await import('../scripts/seed-ai-actions.js');
      await seedModule.seedAiActions();
      actions = await unifiedStorage.getAiActions();
    }
    
    res.json(actions);
  } catch (error) {
    console.error('Error fetching available actions:', error);
    res.status(500).json({ error: 'Failed to fetch available actions' });
  }
});

/**
 * GET /api/ai-agents/:id
 * Get specific AI agent
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const agent = await unifiedStorage.getAiAgent(tenantId, id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Error fetching AI agent:', error);
    res.status(500).json({ error: 'Failed to fetch AI agent' });
  }
});

/**
 * POST /api/ai-agents/generate-config
 * Generate agent configuration from natural language prompt
 */
router.post('/generate-config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🤖 [AI-CONFIG-GEN] Generating config from prompt:', prompt);

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Get available actions
    const actions = await unifiedStorage.getAiActions();
    const actionList = actions.map(a => ({
      actionType: a.actionType,
      name: a.name,
      description: a.description,
      category: a.category
    }));

    const systemPrompt = `You are an AI agent configuration assistant. 
Given a natural language description of what an AI agent should do, generate a complete configuration.

Available actions that can be enabled:
${JSON.stringify(actionList, null, 2)}

Generate a configuration in this exact JSON format:
{
  "name": "Agent name (max 100 chars)",
  "configPrompt": "Clear description of agent's purpose",
  "personality": {
    "tone": "professional|friendly|formal|casual",
    "language": "pt-BR|en|es",
    "greeting": "Initial greeting message",
    "fallbackMessage": "Message when agent doesn't understand",
    "confirmationStyle": "explicit|implicit|none"
  },
  "enabledActions": ["action_type1", "action_type2"],
  "behaviorRules": {
    "requireConfirmation": ["action_type1"],
    "autoEscalateKeywords": ["urgent", "emergency"],
    "maxConversationTurns": 10,
    "collectionStrategy": "sequential|batch|adaptive",
    "errorHandling": "retry|escalate|fallback"
  },
  "aiConfig": {
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "maxTokens": 1000,
    "systemPrompt": "Detailed system prompt for the agent"
  }
}

Select appropriate actions based on the user's request. Be intelligent about defaults.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User request: "${prompt}"` }
      ],
      response_format: { type: 'json_object' }
    });

    const generatedConfig = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ [AI-CONFIG-GEN] Generated config:', generatedConfig);

    res.json({
      success: true,
      config: generatedConfig
    });
  } catch (error) {
    console.error('Error generating config:', error);
    res.status(500).json({ error: 'Failed to generate configuration' });
  }
});

/**
 * POST /api/ai-agents
 * Create new AI agent
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validatedData = insertAiAgentSchema.parse({
      ...req.body,
      tenantId,
      createdBy: userId
    });

    const agent = await unifiedStorage.createAiAgent(validatedData);
    res.status(201).json(agent);
  } catch (error) {
    console.error('Error creating AI agent:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create AI agent' });
  }
});

/**
 * PATCH /api/ai-agents/:id
 * Update AI agent
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if agent exists
    const existing = await unifiedStorage.getAiAgent(tenantId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = await unifiedStorage.updateAiAgent(tenantId, id, req.body);
    res.json(agent);
  } catch (error) {
    console.error('Error updating AI agent:', error);
    res.status(500).json({ error: 'Failed to update AI agent' });
  }
});

/**
 * DELETE /api/ai-agents/:id
 * Delete AI agent
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await unifiedStorage.deleteAiAgent(tenantId, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI agent:', error);
    res.status(500).json({ error: 'Failed to delete AI agent' });
  }
});

// ========================================
// CONVERSATIONS
// ========================================

/**
 * GET /api/ai-conversations
 * List conversations with filters
 */
router.get('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { agentId, userId, status, limit } = req.query;

    const conversations = await unifiedStorage.getAiConversations(tenantId, {
      agentId: agentId as string | undefined,
      userId: userId as string | undefined,
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/ai-conversations/:id
 * Get conversation details with messages and logs
 */
router.get('/conversations/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await unifiedStorage.getAiConversation(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await unifiedStorage.getAiConversationMessages(id);
    const logs = await unifiedStorage.getAiConversationLogs(id);
    const executions = await unifiedStorage.getAiActionExecutions(id);

    res.json({
      conversation,
      messages,
      logs,
      executions
    });
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({ error: 'Failed to fetch conversation details' });
  }
});

// ========================================
// CHAT / MESSAGE PROCESSING
// ========================================

/**
 * POST /api/ai-chat
 * Process incoming message from user
 */
router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { agentId, message, channelType, channelId } = req.body;

    if (!agentId || !message) {
      return res.status(400).json({ error: 'Agent ID and message are required' });
    }

    const result = await conversationManager.processMessage(
      tenantId,
      agentId,
      userId,
      message,
      channelType || 'chat',
      channelId
    );

    res.json(result);
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// ========================================
// FEEDBACK
// ========================================

/**
 * POST /api/ai-conversations/:id/feedback
 * Submit feedback for a conversation
 */
router.post('/conversations/:id/feedback', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversation = await unifiedStorage.getAiConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Validate feedback data
    const validatedData = insertAiConversationFeedbackSchema.parse({
      ...req.body,
      conversationId,
      agentId: conversation.agentId,
      reviewedBy: userId
    });

    const feedback = await unifiedStorage.createAiConversationFeedback(validatedData);
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * GET /api/ai-conversations/:id/feedback
 * Get feedback for a conversation
 */
router.get('/conversations/:id/feedback', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const feedback = await unifiedStorage.getAiConversationFeedback(id);
    res.json(feedback || null);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// ========================================
// LEARNING PATTERNS
// ========================================

/**
 * GET /api/ai-agents/:id/learning-patterns
 * Get learning patterns for an agent
 */
router.get('/:id/learning-patterns', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { applied } = req.query;

    const patterns = await unifiedStorage.getAiLearningPatterns(
      id,
      applied === 'true' ? true : applied === 'false' ? false : undefined
    );

    res.json(patterns);
  } catch (error) {
    console.error('Error fetching learning patterns:', error);
    res.status(500).json({ error: 'Failed to fetch learning patterns' });
  }
});

/**
 * POST /api/ai-agents/:id/learning-patterns/:patternId/apply
 * Apply a learning pattern
 */
router.post('/:id/learning-patterns/:patternId/apply', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patternId } = req.params;

    await unifiedStorage.applyLearningPattern(patternId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error applying learning pattern:', error);
    res.status(500).json({ error: 'Failed to apply learning pattern' });
  }
});

export default router;
