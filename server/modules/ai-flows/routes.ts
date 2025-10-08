// ========================================
// AI VISUAL FLOW BUILDER ROUTES
// ========================================
// RESTful API for managing visual AI flows

import { Router } from 'express';
import { db } from '../../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  aiActionFlows,
  aiNodeDefinitions,
  aiFlowExecutions,
  insertAiActionFlowSchema,
  insertAiNodeDefinitionSchema
} from '../../../shared/schema-ai-flows';
import { NODE_DEFINITIONS, getAllCategories, getNodeByType } from './node-registry';
import { executeFlow } from './flow-executor';

const router = Router();

// ========================================
// FLOW CRUD OPERATIONS
// ========================================

// GET /api/ai-flows - List all flows for tenant
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const flows = await db.query.aiActionFlows.findMany({
      where: eq(aiActionFlows.tenantId, tenantId),
      orderBy: [desc(aiActionFlows.createdAt)]
    });

    res.json({ success: true, data: flows });
  } catch (error) {
    console.error('[AI Flows] Error listing flows:', error);
    res.status(500).json({ success: false, message: 'Failed to list flows' });
  }
});

// GET /api/ai-flows/:id - Get single flow
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const flow = await db.query.aiActionFlows.findFirst({
      where: and(
        eq(aiActionFlows.id, req.params.id),
        eq(aiActionFlows.tenantId, tenantId)
      )
    });

    if (!flow) {
      return res.status(404).json({ success: false, message: 'Flow not found' });
    }

    res.json({ success: true, data: flow });
  } catch (error) {
    console.error('[AI Flows] Error fetching flow:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch flow' });
  }
});

// POST /api/ai-flows - Create new flow
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const flowData = insertAiActionFlowSchema.parse({
      ...req.body,
      tenantId,
      createdBy: userId
    });

    const [flow] = await db.insert(aiActionFlows)
      .values(flowData)
      .returning();

    res.json({ success: true, data: flow });
  } catch (error: any) {
    console.error('[AI Flows] Error creating flow:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create flow' 
    });
  }
});

// PATCH /api/ai-flows/:id - Update flow
router.patch('/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if flow exists and belongs to tenant
    const existingFlow = await db.query.aiActionFlows.findFirst({
      where: and(
        eq(aiActionFlows.id, req.params.id),
        eq(aiActionFlows.tenantId, tenantId)
      )
    });

    if (!existingFlow) {
      return res.status(404).json({ success: false, message: 'Flow not found' });
    }

    const [updatedFlow] = await db.update(aiActionFlows)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(aiActionFlows.id, req.params.id))
      .returning();

    res.json({ success: true, data: updatedFlow });
  } catch (error: any) {
    console.error('[AI Flows] Error updating flow:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update flow' 
    });
  }
});

// DELETE /api/ai-flows/:id - Delete flow (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if flow exists and belongs to tenant
    const existingFlow = await db.query.aiActionFlows.findFirst({
      where: and(
        eq(aiActionFlows.id, req.params.id),
        eq(aiActionFlows.tenantId, tenantId)
      )
    });

    if (!existingFlow) {
      return res.status(404).json({ success: false, message: 'Flow not found' });
    }

    // Soft delete
    await db.update(aiActionFlows)
      .set({ 
        deletedAt: new Date(),
        status: 'archived'
      })
      .where(eq(aiActionFlows.id, req.params.id));

    res.json({ success: true, message: 'Flow deleted successfully' });
  } catch (error) {
    console.error('[AI Flows] Error deleting flow:', error);
    res.status(500).json({ success: false, message: 'Failed to delete flow' });
  }
});

// ========================================
// NODE REGISTRY OPERATIONS
// ========================================

// GET /api/ai-flows/nodes/available - List all available node types
router.get('/nodes/available', async (req, res) => {
  try {
    const categories = getAllCategories();
    const nodes = NODE_DEFINITIONS.map(node => ({
      type: node.type,
      name: node.name,
      description: node.description,
      category: node.category,
      icon: node.icon,
      color: node.color,
      inputs: node.inputs,
      outputs: node.outputs,
      configSchema: node.configSchema
    }));

    res.json({ 
      success: true, 
      data: {
        categories,
        nodes,
        totalNodes: nodes.length
      }
    });
  } catch (error) {
    console.error('[AI Flows] Error listing available nodes:', error);
    res.status(500).json({ success: false, message: 'Failed to list available nodes' });
  }
});

// GET /api/ai-flows/nodes/:type - Get node definition by type
router.get('/nodes/:type', async (req, res) => {
  try {
    const nodeType = req.params.type;
    const node = getNodeByType(nodeType);

    if (!node) {
      return res.status(404).json({ success: false, message: 'Node type not found' });
    }

    res.json({ success: true, data: node });
  } catch (error) {
    console.error('[AI Flows] Error fetching node definition:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch node definition' });
  }
});

// POST /api/ai-flows/nodes/seed - Seed node definitions to database (admin only)
router.post('/nodes/seed', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user?.isSaasAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Delete existing system nodes
    await db.delete(aiNodeDefinitions)
      .where(eq(aiNodeDefinitions.isSystemNode, true));

    // Insert all node definitions
    const insertedNodes = await db.insert(aiNodeDefinitions)
      .values(NODE_DEFINITIONS)
      .returning();

    res.json({ 
      success: true, 
      message: `Successfully seeded ${insertedNodes.length} node definitions`,
      data: { count: insertedNodes.length }
    });
  } catch (error) {
    console.error('[AI Flows] Error seeding nodes:', error);
    res.status(500).json({ success: false, message: 'Failed to seed node definitions' });
  }
});

// ========================================
// FLOW EXECUTION
// ========================================

// POST /api/ai-flows/:id/execute - Execute a flow
router.post('/:id/execute', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch flow
    const flow = await db.query.aiActionFlows.findFirst({
      where: and(
        eq(aiActionFlows.id, req.params.id),
        eq(aiActionFlows.tenantId, tenantId)
      )
    });

    if (!flow) {
      return res.status(404).json({ success: false, message: 'Flow not found' });
    }

    if (flow.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Flow must be active to execute' 
      });
    }

    // Execute flow
    const executionContext = {
      variables: req.body.input || {},
      conversationId: req.body.conversationId,
      userId,
      tenantId
    };

    const result = await executeFlow(flow, executionContext, req.body.input);

    // Update flow stats
    await db.update(aiActionFlows)
      .set({
        stats: sql`jsonb_set(
          COALESCE(stats, '{}'::jsonb),
          '{totalExecutions}',
          (COALESCE((stats->>'totalExecutions')::int, 0) + 1)::text::jsonb
        )`
      })
      .where(eq(aiActionFlows.id, flow.id));

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Flows] Error executing flow:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to execute flow' 
    });
  }
});

// GET /api/ai-flows/:id/executions - Get execution history for a flow
router.get('/:id/executions', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const executions = await db.query.aiFlowExecutions.findMany({
      where: and(
        eq(aiFlowExecutions.flowId, req.params.id),
        eq(aiFlowExecutions.tenantId, tenantId)
      ),
      orderBy: [desc(aiFlowExecutions.startedAt)],
      limit,
      offset
    });

    res.json({ success: true, data: executions });
  } catch (error) {
    console.error('[AI Flows] Error fetching executions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch executions' });
  }
});

// GET /api/ai-flows/executions/:executionId - Get single execution details
router.get('/executions/:executionId', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const execution = await db.query.aiFlowExecutions.findFirst({
      where: and(
        eq(aiFlowExecutions.id, req.params.executionId),
        eq(aiFlowExecutions.tenantId, tenantId)
      )
    });

    if (!execution) {
      return res.status(404).json({ success: false, message: 'Execution not found' });
    }

    res.json({ success: true, data: execution });
  } catch (error) {
    console.error('[AI Flows] Error fetching execution:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch execution' });
  }
});

// ========================================
// FLOW TEMPLATES
// ========================================

// GET /api/ai-flows/templates - List template flows
router.get('/templates', async (req, res) => {
  try {
    const templates = await db.query.aiActionFlows.findMany({
      where: eq(aiActionFlows.isTemplate, true)
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('[AI Flows] Error listing templates:', error);
    res.status(500).json({ success: false, message: 'Failed to list templates' });
  }
});

// POST /api/ai-flows/:id/duplicate - Duplicate a flow (alias for clone)
router.post('/:id/duplicate', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const sourceFlow = await db.query.aiActionFlows.findFirst({
      where: eq(aiActionFlows.id, req.params.id)
    });

    if (!sourceFlow) {
      return res.status(404).json({ success: false, message: 'Source flow not found' });
    }

    // Clone flow with new name
    const [clonedFlow] = await db.insert(aiActionFlows)
      .values({
        ...sourceFlow,
        id: undefined as any,
        tenantId,
        name: `${sourceFlow.name} (Cópia)`,
        status: 'draft',
        isTemplate: false,
        createdBy: userId,
        createdAt: undefined as any,
        updatedAt: undefined as any,
        stats: {}
      })
      .returning();

    res.json({ success: true, data: clonedFlow });
  } catch (error) {
    console.error('[AI Flows] Error cloning flow:', error);
    res.status(500).json({ success: false, message: 'Failed to clone flow' });
  }
});

// ========================================
// EXPORTS
// ========================================

export default router;
