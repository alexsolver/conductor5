/**
 * AI Configurable Actions Routes
 * 
 * API endpoints para gerenciar ações configuráveis que podem ser executadas por agentes IA.
 * Permite criar, editar e vincular ações a módulos/endpoints do sistema.
 */

import { Router, Response } from 'express';
import { db } from '../../db';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import { 
  aiConfigurableActions,
  aiActionFields,
  aiActionFieldMappings,
  aiAgentActionBindings,
  aiFieldCollectionHistory,
  insertAiConfigurableActionSchema,
  insertAiActionFieldSchema,
  insertAiActionFieldMappingSchema,
  insertAiAgentActionBindingSchema,
  type AiConfigurableAction,
  type AiActionField,
  type InsertAiConfigurableAction,
  type InsertAiActionField
} from '../../../shared/schema-ai-configurable-actions';
import { internalForms } from '../../../shared/schema-internal-forms';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// ========================================
// CRUD DE AÇÕES CONFIGURÁVEIS
// ========================================

/**
 * GET /api/ai-configurable-actions
 * Lista todas as ações configuráveis do tenant
 */
router.get('/', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    const actions = await db
      .select()
      .from(aiConfigurableActions)
      .where(eq(aiConfigurableActions.tenantId, tenantId))
      .orderBy(desc(aiConfigurableActions.createdAt));

    return res.json({ actions });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error listing actions:', error);
    return res.status(500).json({ 
      error: 'Erro ao listar ações configuráveis', 
      details: error.message 
    });
  }
});

/**
 * GET /api/ai-configurable-actions/:id
 * Busca uma ação configurável específica com seus campos e mapeamentos
 */
router.get('/:id', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Buscar ação
    const [action] = await db
      .select()
      .from(aiConfigurableActions)
      .where(
        and(
          eq(aiConfigurableActions.id, id),
          eq(aiConfigurableActions.tenantId, tenantId)
        )
      );

    if (!action) {
      return res.status(404).json({ error: 'Ação não encontrada' });
    }

    // Buscar campos da ação
    const fields = await db
      .select()
      .from(aiActionFields)
      .where(eq(aiActionFields.actionId, id))
      .orderBy(aiActionFields.displayOrder);

    // Buscar mapeamentos
    const mappings = await db
      .select()
      .from(aiActionFieldMappings)
      .where(eq(aiActionFieldMappings.actionId, id));

    // Se houver formulário vinculado, buscar dados do formulário
    let linkedForm = null;
    if (action.linkedFormId) {
      [linkedForm] = await db
        .select()
        .from(internalForms)
        .where(eq(internalForms.id, action.linkedFormId));
    }

    return res.json({ 
      action, 
      fields,
      mappings,
      linkedForm 
    });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error fetching action:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar ação configurável', 
      details: error.message 
    });
  }
});

/**
 * POST /api/ai-configurable-actions
 * Cria uma nova ação configurável
 */
router.post('/', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Tenant ID ou User ID não encontrado' });
    }

    // Validar dados da ação
    const validatedData = insertAiConfigurableActionSchema.parse({
      ...req.body,
      tenantId,
      createdBy: userId
    });

    // Criar ação
    const [newAction] = await db
      .insert(aiConfigurableActions)
      .values(validatedData)
      .returning();

    return res.status(201).json({ action: newAction });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error creating action:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Erro ao criar ação configurável', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/ai-configurable-actions/:id
 * Atualiza uma ação configurável existente
 */
router.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Tenant ID ou User ID não encontrado' });
    }

    // Verificar se ação existe
    const [existingAction] = await db
      .select()
      .from(aiConfigurableActions)
      .where(
        and(
          eq(aiConfigurableActions.id, id),
          eq(aiConfigurableActions.tenantId, tenantId)
        )
      );

    if (!existingAction) {
      return res.status(404).json({ error: 'Ação não encontrada' });
    }

    // Atualizar ação
    const [updatedAction] = await db
      .update(aiConfigurableActions)
      .set({
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(aiConfigurableActions.id, id))
      .returning();

    return res.json({ action: updatedAction });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error updating action:', error);
    return res.status(500).json({ 
      error: 'Erro ao atualizar ação configurável', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/ai-configurable-actions/:id
 * Remove uma ação configurável
 */
router.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Verificar se ação existe
    const [existingAction] = await db
      .select()
      .from(aiConfigurableActions)
      .where(
        and(
          eq(aiConfigurableActions.id, id),
          eq(aiConfigurableActions.tenantId, tenantId)
        )
      );

    if (!existingAction) {
      return res.status(404).json({ error: 'Ação não encontrada' });
    }

    // Remover campos associados
    await db
      .delete(aiActionFields)
      .where(eq(aiActionFields.actionId, id));

    // Remover mapeamentos associados
    await db
      .delete(aiActionFieldMappings)
      .where(eq(aiActionFieldMappings.actionId, id));

    // Remover bindings com agentes
    await db
      .delete(aiAgentActionBindings)
      .where(eq(aiAgentActionBindings.actionId, id));

    // Remover ação
    await db
      .delete(aiConfigurableActions)
      .where(eq(aiConfigurableActions.id, id));

    return res.json({ message: 'Ação removida com sucesso' });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error deleting action:', error);
    return res.status(500).json({ 
      error: 'Erro ao remover ação configurável', 
      details: error.message 
    });
  }
});

// ========================================
// CAMPOS DA AÇÃO
// ========================================

/**
 * POST /api/ai-configurable-actions/:actionId/fields
 * Adiciona um novo campo à ação
 */
router.post('/:actionId/fields', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Verificar se ação existe
    const [action] = await db
      .select()
      .from(aiConfigurableActions)
      .where(
        and(
          eq(aiConfigurableActions.id, actionId),
          eq(aiConfigurableActions.tenantId, tenantId)
        )
      );

    if (!action) {
      return res.status(404).json({ error: 'Ação não encontrada' });
    }

    // Validar dados do campo
    const validatedData = insertAiActionFieldSchema.parse({
      ...req.body,
      actionId
    });

    // Criar campo
    const [newField] = await db
      .insert(aiActionFields)
      .values(validatedData)
      .returning();

    return res.status(201).json({ field: newField });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error creating field:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Erro ao criar campo', 
      details: error.message 
    });
  }
});

/**
 * POST /api/ai-configurable-actions/fields/bulk
 * Cria múltiplos campos em uma ação (bulk insert)
 */
router.post('/fields/bulk', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fields } = req.body;
    
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'Array de fields é obrigatório' });
    }

    // Criar todos os campos
    const createdFields = await db
      .insert(aiActionFields)
      .values(fields)
      .returning();

    return res.status(201).json({ fields: createdFields });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error creating fields in bulk:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Erro ao criar campos', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/ai-configurable-actions/:actionId/fields/:fieldId
 * Atualiza um campo existente
 */
router.put('/:actionId/fields/:fieldId', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId, fieldId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Verificar se campo existe
    const [existingField] = await db
      .select()
      .from(aiActionFields)
      .where(
        and(
          eq(aiActionFields.id, fieldId),
          eq(aiActionFields.actionId, actionId)
        )
      );

    if (!existingField) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }

    // Atualizar campo
    const [updatedField] = await db
      .update(aiActionFields)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(aiActionFields.id, fieldId))
      .returning();

    return res.json({ field: updatedField });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error updating field:', error);
    return res.status(500).json({ 
      error: 'Erro ao atualizar campo', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/ai-configurable-actions/:actionId/fields/:fieldId
 * Remove um campo da ação
 */
router.delete('/:actionId/fields/:fieldId', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId, fieldId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Verificar se campo existe
    const [existingField] = await db
      .select()
      .from(aiActionFields)
      .where(
        and(
          eq(aiActionFields.id, fieldId),
          eq(aiActionFields.actionId, actionId)
        )
      );

    if (!existingField) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }

    // Remover mapeamentos do campo
    await db
      .delete(aiActionFieldMappings)
      .where(eq(aiActionFieldMappings.fieldId, fieldId));

    // Remover campo
    await db
      .delete(aiActionFields)
      .where(eq(aiActionFields.id, fieldId));

    return res.json({ message: 'Campo removido com sucesso' });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error deleting field:', error);
    return res.status(500).json({ 
      error: 'Erro ao remover campo', 
      details: error.message 
    });
  }
});

// ========================================
// MAPEAMENTOS DE CAMPOS
// ========================================

/**
 * POST /api/ai-configurable-actions/:actionId/mappings
 * Cria um novo mapeamento de campo
 */
router.post('/:actionId/mappings', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Validar dados do mapeamento
    const validatedData = insertAiActionFieldMappingSchema.parse({
      ...req.body,
      actionId
    });

    // Criar mapeamento
    const [newMapping] = await db
      .insert(aiActionFieldMappings)
      .values(validatedData)
      .returning();

    return res.status(201).json({ mapping: newMapping });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error creating mapping:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Erro ao criar mapeamento', 
      details: error.message 
    });
  }
});

/**
 * PUT /api/ai-configurable-actions/:actionId/mappings/:mappingId
 * Atualiza um mapeamento existente
 */
router.put('/:actionId/mappings/:mappingId', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mappingId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Atualizar mapeamento
    const [updatedMapping] = await db
      .update(aiActionFieldMappings)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(aiActionFieldMappings.id, mappingId))
      .returning();

    if (!updatedMapping) {
      return res.status(404).json({ error: 'Mapeamento não encontrado' });
    }

    return res.json({ mapping: updatedMapping });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error updating mapping:', error);
    return res.status(500).json({ 
      error: 'Erro ao atualizar mapeamento', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/ai-configurable-actions/:actionId/mappings/:mappingId
 * Remove um mapeamento
 */
router.delete('/:actionId/mappings/:mappingId', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mappingId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    await db
      .delete(aiActionFieldMappings)
      .where(eq(aiActionFieldMappings.id, mappingId));

    return res.json({ message: 'Mapeamento removido com sucesso' });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error deleting mapping:', error);
    return res.status(500).json({ 
      error: 'Erro ao remover mapeamento', 
      details: error.message 
    });
  }
});

// ========================================
// VINCULAÇÃO COM AGENTES
// ========================================

/**
 * POST /api/ai-configurable-actions/:actionId/bind-agent
 * Vincula uma ação a um agente IA
 */
router.post('/:actionId/bind-agent', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const { agentId } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID é obrigatório' });
    }

    // Validar dados do binding
    const validatedData = insertAiAgentActionBindingSchema.parse({
      ...req.body,
      actionId,
      agentId
    });

    // Criar binding
    const [newBinding] = await db
      .insert(aiAgentActionBindings)
      .values(validatedData)
      .returning();

    return res.status(201).json({ binding: newBinding });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error binding agent:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Erro ao vincular agente', 
      details: error.message 
    });
  }
});

/**
 * GET /api/ai-configurable-actions/:actionId/agents
 * Lista agentes vinculados a uma ação
 */
router.get('/:actionId/agents', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    const bindings = await db
      .select()
      .from(aiAgentActionBindings)
      .where(eq(aiAgentActionBindings.actionId, actionId));

    return res.json({ bindings });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error listing agent bindings:', error);
    return res.status(500).json({ 
      error: 'Erro ao listar agentes vinculados', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/ai-configurable-actions/:actionId/bind-agent/:bindingId
 * Remove vinculação entre ação e agente
 */
router.delete('/:actionId/bind-agent/:bindingId', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bindingId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    await db
      .delete(aiAgentActionBindings)
      .where(eq(aiAgentActionBindings.id, bindingId));

    return res.json({ message: 'Vinculação removida com sucesso' });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error removing agent binding:', error);
    return res.status(500).json({ 
      error: 'Erro ao remover vinculação', 
      details: error.message 
    });
  }
});

// ========================================
// ESTATÍSTICAS E ANÁLISES
// ========================================

/**
 * GET /api/ai-configurable-actions/:actionId/stats
 * Retorna estatísticas de uso de uma ação
 */
router.get('/:actionId/stats', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    const [action] = await db
      .select()
      .from(aiConfigurableActions)
      .where(
        and(
          eq(aiConfigurableActions.id, actionId),
          eq(aiConfigurableActions.tenantId, tenantId)
        )
      );

    if (!action) {
      return res.status(404).json({ error: 'Ação não encontrada' });
    }

    return res.json({ stats: action.stats });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error fetching stats:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar estatísticas', 
      details: error.message 
    });
  }
});

/**
 * GET /api/ai-configurable-actions/:actionId/collection-history
 * Retorna histórico de coleta de campos
 */
router.get('/:actionId/collection-history', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const tenantId = req.user?.tenantId;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Buscar histórico de coleta de campos desta ação
    const history = await db
      .select()
      .from(aiFieldCollectionHistory)
      .innerJoin(aiActionFields, eq(aiFieldCollectionHistory.fieldId, aiActionFields.id))
      .where(eq(aiActionFields.actionId, actionId))
      .orderBy(desc(aiFieldCollectionHistory.createdAt))
      .limit(limit);

    return res.json({ history });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error fetching collection history:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar histórico de coleta', 
      details: error.message 
    });
  }
});

// ========================================
// EXECUÇÃO DE AÇÕES
// ========================================

/**
 * POST /api/ai-configurable-actions/:actionId/execute
 * Executa uma ação configurável com os dados coletados
 */
router.post('/:actionId/execute', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const { collectedData, conversationId, sessionId } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Usuário não autenticado' });
    }

    if (!collectedData) {
      return res.status(400).json({ error: 'Dados de coleta não fornecidos' });
    }

    // Import action executor
    const { actionExecutor } = await import('./action-executor');

    // Execute action
    const result = await actionExecutor.executeAction(
      actionId,
      collectedData,
      {
        tenantId,
        userId,
        conversationId,
        sessionId
      }
    );

    return res.json(result);
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error executing action:', error);
    return res.status(500).json({ 
      error: 'Erro ao executar ação', 
      details: error.message 
    });
  }
});

/**
 * POST /api/ai-configurable-actions/:actionId/validate
 * Valida dados coletados e retorna campos faltantes
 */
router.post('/:actionId/validate', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const { collectedData } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    if (!collectedData) {
      return res.status(400).json({ error: 'Dados de coleta não fornecidos' });
    }

    // Import action executor
    const { actionExecutor } = await import('./action-executor');

    // Get missing fields
    const missingFields = await actionExecutor.getMissingFields(
      actionId,
      collectedData,
      tenantId
    );

    return res.json({ 
      isValid: missingFields.length === 0,
      missingFields 
    });
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error validating action:', error);
    return res.status(500).json({ 
      error: 'Erro ao validar ação', 
      details: error.message 
    });
  }
});

/**
 * POST /api/ai-configurable-actions/:actionId/extract
 * Extrai entidades da conversa usando OpenAI Function Calling
 */
router.post('/:actionId/extract', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const { userMessage, conversationHistory, previouslyExtractedData } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    if (!userMessage) {
      return res.status(400).json({ error: 'Mensagem do usuário não fornecida' });
    }

    // Import entity extractor
    const { entityExtractor } = await import('./entity-extractor');

    // Extract entities
    const result = await entityExtractor.extractForAction(
      actionId,
      {
        userMessage,
        conversationHistory,
        previouslyExtractedData
      },
      tenantId
    );

    return res.json(result);
  } catch (error: any) {
    console.error('[AI-CONFIG-ACTIONS] Error extracting entities:', error);
    return res.status(500).json({ 
      error: 'Erro ao extrair entidades', 
      details: error.message 
    });
  }
});

export default router;
