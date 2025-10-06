// ========================================
// MESSAGE AI ROUTES
// ========================================
// API routes for AI-powered message assistance

import { Router, Response } from 'express';
import { MessageAIService } from '../services/message-ai-service';
import { storage } from '../storage-simple';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/jwtAuth';

const router = Router();

// Validation schemas
const spellCheckSchema = z.object({
  text: z.string().min(1, 'Text is required')
});

const rewriteSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  tone: z.enum(['professional', 'friendly', 'empathetic', 'technical', 'concise'])
});

const translateSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  targetLanguage: z.string().min(2, 'Target language is required')
});

const summarizeSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  type: z.enum(['short', 'expanded'])
});

const quickRepliesSchema = z.object({
  conversationContext: z.string().min(1, 'Conversation context is required')
});

// Initialize service
const messageAIService = new MessageAIService(storage);

/**
 * POST /api/message-ai/spell-check
 * Check spelling and grammar
 */
router.post('/spell-check', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = spellCheckSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { text } = validation.data;
    const result = await messageAIService.spellCheck(tenantId, text);

    res.json(result);
  } catch (error: any) {
    console.error('❌ [MESSAGE-AI] Spell check error:', error);
    res.status(500).json({ error: error.message || 'Failed to check spelling' });
  }
});

/**
 * POST /api/message-ai/rewrite
 * Rewrite text with specific tone
 */
router.post('/rewrite', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = rewriteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { text, tone } = validation.data;
    const result = await messageAIService.rewriteWithTone(tenantId, text, tone);

    res.json(result);
  } catch (error: any) {
    console.error('❌ [MESSAGE-AI] Rewrite error:', error);
    res.status(500).json({ error: error.message || 'Failed to rewrite text' });
  }
});

/**
 * POST /api/message-ai/translate
 * Translate text to target language
 */
router.post('/translate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = translateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { text, targetLanguage } = validation.data;
    const result = await messageAIService.translate(tenantId, text, targetLanguage);

    res.json(result);
  } catch (error: any) {
    console.error('❌ [MESSAGE-AI] Translation error:', error);
    res.status(500).json({ error: error.message || 'Failed to translate text' });
  }
});

/**
 * POST /api/message-ai/summarize
 * Summarize or expand text
 */
router.post('/summarize', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = summarizeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { text, type } = validation.data;
    const result = await messageAIService.summarize(tenantId, text, type);

    res.json(result);
  } catch (error: any) {
    console.error('❌ [MESSAGE-AI] Summarize error:', error);
    res.status(500).json({ error: error.message || 'Failed to process text' });
  }
});

/**
 * POST /api/message-ai/quick-replies
 * Generate quick reply suggestions
 */
router.post('/quick-replies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = quickRepliesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { conversationContext } = validation.data;
    const result = await messageAIService.generateQuickReplies(tenantId, conversationContext);

    res.json(result);
  } catch (error: any) {
    console.error('❌ [MESSAGE-AI] Quick replies error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quick replies' });
  }
});

export default router;
