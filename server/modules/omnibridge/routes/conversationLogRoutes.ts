// API Routes: Conversation Logging & Learning System
// Rotas para acessar logs de conversas, feedback e analytics

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../../db';
import { 
  conversationLogs, 
  conversationMessages,
  actionExecutions,
  feedbackAnnotations,
  agentImprovements 
} from '@shared/schema-omnibridge-logging';
import { eq, and, desc, gte, lte, like, sql, count, avg } from 'drizzle-orm';

const router = Router();

// GET /api/omnibridge/conversation-logs - Listar conversas
router.get('/conversation-logs', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { agentId, limit = 50, offset = 0, startDate, endDate } = req.query;

    const conditions = [eq(conversationLogs.tenantId, tenantId)];

    if (agentId) {
      conditions.push(eq(conversationLogs.agentId, Number(agentId)));
    }
    if (startDate) {
      conditions.push(gte(conversationLogs.startedAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(conversationLogs.startedAt, new Date(endDate as string)));
    }

    const results = await db
      .select()
      .from(conversationLogs)
      .where(and(...conditions))
      .orderBy(desc(conversationLogs.startedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(conversationLogs)
      .where(and(...conditions));

    res.json({
      success: true,
      data: results,
      total: Number(total),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching conversation logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversation logs' });
  }
});

// GET /api/omnibridge/conversation-logs/:id - Detalhes de uma conversa
router.get('/conversation-logs/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    // Get conversation
    const [conversation] = await db
      .select()
      .from(conversationLogs)
      .where(and(eq(conversationLogs.id, Number(id)), eq(conversationLogs.tenantId, tenantId)));

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    // Get messages
    const messages = await db
      .select()
      .from(conversationMessages)
      .where(and(
        eq(conversationMessages.conversationId, Number(id)),
        eq(conversationMessages.tenantId, tenantId)
      ))
      .orderBy(conversationMessages.timestamp);

    // Get actions
    const actions = await db
      .select()
      .from(actionExecutions)
      .where(and(
        eq(actionExecutions.conversationId, Number(id)),
        eq(actionExecutions.tenantId, tenantId)
      ))
      .orderBy(actionExecutions.executedAt);

    // Get feedback
    const feedback = await db
      .select()
      .from(feedbackAnnotations)
      .where(and(
        eq(feedbackAnnotations.conversationId, Number(id)),
        eq(feedbackAnnotations.tenantId, tenantId)
      ));

    res.json({
      success: true,
      data: {
        conversation,
        messages,
        actions,
        feedback,
      },
    });
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversation details' });
  }
});

// POST /api/omnibridge/conversation-logs/:id/feedback - Adicionar feedback
router.post('/conversation-logs/:id/feedback', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const userId = req.user!.id;

    const feedbackSchema = z.object({
      messageId: z.number().optional(),
      actionExecutionId: z.number().optional(),
      rating: z.enum(['excellent', 'good', 'neutral', 'poor', 'terrible']).optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      correctiveAction: z.string().optional(),
      expectedBehavior: z.string().optional(),
      actualBehavior: z.string().optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    });

    const data = feedbackSchema.parse(req.body);

    const [result] = await db
      .insert(feedbackAnnotations)
      .values({
        tenantId,
        conversationId: Number(id),
        messageId: data.messageId || null,
        actionExecutionId: data.actionExecutionId || null,
        rating: data.rating || null,
        category: data.category || null,
        tags: data.tags || null,
        notes: data.notes || null,
        correctiveAction: data.correctiveAction || null,
        expectedBehavior: data.expectedBehavior || null,
        actualBehavior: data.actualBehavior || null,
        severity: data.severity || null,
        annotatedBy: userId,
        resolved: false,
      })
      .returning();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to add feedback' });
  }
});

// GET /api/omnibridge/conversation-logs/analytics/:agentId - Analytics do agente
router.get('/conversation-logs/analytics/:agentId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { agentId } = req.params;
    const { startDate, endDate } = req.query;

    const conditions = [
      eq(conversationLogs.agentId, Number(agentId)),
      eq(conversationLogs.tenantId, tenantId),
    ];

    if (startDate) {
      conditions.push(gte(conversationLogs.startedAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(conversationLogs.startedAt, new Date(endDate as string)));
    }

    // Conversation statistics
    const [convStats] = await db
      .select({
        totalConversations: count(),
        totalMessages: sql<number>`SUM(${conversationLogs.totalMessages})`,
        totalActions: sql<number>`SUM(${conversationLogs.totalActions})`,
        escalatedCount: sql<number>`SUM(CASE WHEN ${conversationLogs.escalatedToHuman} THEN 1 ELSE 0 END)`,
        avgMessages: avg(conversationLogs.totalMessages),
        avgActions: avg(conversationLogs.totalActions),
      })
      .from(conversationLogs)
      .where(and(...conditions));

    // Action statistics
    const actionStats = await db
      .select({
        actionName: actionExecutions.actionName,
        total: count(),
        success: sql<number>`SUM(CASE WHEN ${actionExecutions.success} THEN 1 ELSE 0 END)`,
        avgTime: avg(actionExecutions.executionTimeMs),
      })
      .from(actionExecutions)
      .innerJoin(conversationLogs, eq(actionExecutions.conversationId, conversationLogs.id))
      .where(and(...conditions))
      .groupBy(actionExecutions.actionName);

    // Feedback statistics
    const [feedbackStats] = await db
      .select({
        total: count(),
        excellent: sql<number>`SUM(CASE WHEN ${feedbackAnnotations.rating} = 'excellent' THEN 1 ELSE 0 END)`,
        good: sql<number>`SUM(CASE WHEN ${feedbackAnnotations.rating} = 'good' THEN 1 ELSE 0 END)`,
        neutral: sql<number>`SUM(CASE WHEN ${feedbackAnnotations.rating} = 'neutral' THEN 1 ELSE 0 END)`,
        poor: sql<number>`SUM(CASE WHEN ${feedbackAnnotations.rating} = 'poor' THEN 1 ELSE 0 END)`,
        terrible: sql<number>`SUM(CASE WHEN ${feedbackAnnotations.rating} = 'terrible' THEN 1 ELSE 0 END)`,
        resolved: sql<number>`SUM(CASE WHEN ${feedbackAnnotations.resolved} THEN 1 ELSE 0 END)`,
      })
      .from(feedbackAnnotations)
      .innerJoin(conversationLogs, eq(feedbackAnnotations.conversationId, conversationLogs.id))
      .where(and(...conditions));

    const totalConv = Number(convStats.totalConversations) || 0;
    const escalated = Number(convStats.escalatedCount) || 0;

    res.json({
      success: true,
      data: {
        conversations: {
          total: totalConv,
          totalMessages: Number(convStats.totalMessages) || 0,
          totalActions: Number(convStats.totalActions) || 0,
          escalationRate: totalConv > 0 ? (escalated / totalConv) * 100 : 0,
          avgMessagesPerConversation: Number(convStats.avgMessages) || 0,
          avgActionsPerConversation: Number(convStats.avgActions) || 0,
        },
        actions: actionStats.map(a => ({
          actionName: a.actionName,
          total: Number(a.total),
          success: Number(a.success),
          failed: Number(a.total) - Number(a.success),
          successRate: Number(a.total) > 0 ? (Number(a.success) / Number(a.total)) * 100 : 0,
          avgExecutionTime: Number(a.avgTime) || 0,
        })),
        feedback: {
          total: Number(feedbackStats?.total) || 0,
          byRating: {
            excellent: Number(feedbackStats?.excellent) || 0,
            good: Number(feedbackStats?.good) || 0,
            neutral: Number(feedbackStats?.neutral) || 0,
            poor: Number(feedbackStats?.poor) || 0,
            terrible: Number(feedbackStats?.terrible) || 0,
          },
          resolved: Number(feedbackStats?.resolved) || 0,
          unresolved: (Number(feedbackStats?.total) || 0) - (Number(feedbackStats?.resolved) || 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// PATCH /api/omnibridge/feedback/:id - Atualizar feedback
router.patch('/feedback/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const updateSchema = z.object({
      rating: z.enum(['excellent', 'good', 'neutral', 'poor', 'terrible']).optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      correctiveAction: z.string().optional(),
      expectedBehavior: z.string().optional(),
      actualBehavior: z.string().optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      resolved: z.boolean().optional(),
    });

    const data = updateSchema.parse(req.body);

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.resolved) {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user!.id;
    }

    const [result] = await db
      .update(feedbackAnnotations)
      .set(updateData)
      .where(and(eq(feedbackAnnotations.id, Number(id)), eq(feedbackAnnotations.tenantId, tenantId)))
      .returning();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to update feedback' });
  }
});

// GET /api/omnibridge/feedback - Listar feedback
router.get('/feedback', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { conversationId, resolved, severity, rating, limit = 50, offset = 0 } = req.query;

    const conditions = [eq(feedbackAnnotations.tenantId, tenantId)];

    if (conversationId) {
      conditions.push(eq(feedbackAnnotations.conversationId, Number(conversationId)));
    }
    if (resolved !== undefined) {
      conditions.push(eq(feedbackAnnotations.resolved, resolved === 'true'));
    }
    if (severity) {
      conditions.push(eq(feedbackAnnotations.severity, severity as string));
    }
    if (rating) {
      conditions.push(eq(feedbackAnnotations.rating, rating as any));
    }

    const results = await db
      .select()
      .from(feedbackAnnotations)
      .where(and(...conditions))
      .orderBy(desc(feedbackAnnotations.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(feedbackAnnotations)
      .where(and(...conditions));

    res.json({
      success: true,
      data: results,
      total: Number(total),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feedback' });
  }
});

export default router;
