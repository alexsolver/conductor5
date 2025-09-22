import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { GlobalAutomationManager } from '../modules/omnibridge/infrastructure/services/AutomationEngine';
import { AutomationRule, AutomationCondition, AutomationAction } from '../modules/omnibridge/domain/entities/AutomationRule';
import { DrizzleAutomationRuleRepository } from '../modules/omnibridge/infrastructure/repositories/DrizzleAutomationRuleRepository';

const router = Router();

// Aplicar middleware de autenticação
router.use(jwtAuth);

/**
 * Obter todas as regras de automação do tenant
 */
router.get('/', async (req: any, res) => {
  const startTime = Date.now();
  let tenantId: string | undefined;

  try {
    console.log('🔄 [AUTOMATION-RULES] Starting rules fetch request');

    tenantId = req.user?.tenantId;
    console.log(`🔍 [AUTOMATION-RULES] Tenant ID: ${tenantId}`);

    if (!tenantId) {
      console.error('❌ [AUTOMATION-RULES] No tenant ID found in request');
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    console.log('🚀 [AUTOMATION-RULES] Initializing automation manager...');
    const automationManager = GlobalAutomationManager.getInstance();

    console.log('🔧 [AUTOMATION-RULES] Getting engine for tenant...');
    const engine = automationManager.getEngine(tenantId);

    console.log('📋 [AUTOMATION-RULES] Fetching rules...');
    const rules = engine.getRules();

    const responseTime = Date.now() - startTime;
    console.log(`✅ [AUTOMATION-RULES] Successfully retrieved ${rules.length} rules for tenant: ${tenantId} (${responseTime}ms)`);

    const mappedRules = rules.filter(rule => rule && typeof rule === 'object').map(rule => {
      // Validação robusta de cada campo
      const safeRule = {
        id: (rule?.id && typeof rule.id === 'string') ? rule.id : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: (rule?.name && typeof rule.name === 'string') ? rule.name : 'Nome não disponível',
        description: (rule?.description && typeof rule.description === 'string') ? rule.description : 'Descrição não disponível',
        enabled: Boolean(rule?.enabled),
        priority: (typeof rule?.priority === 'number' && rule.priority > 0) ? rule.priority : 1,
        conditionsCount: Array.isArray(rule?.conditions) ? rule.conditions.length : 0,
        actionsCount: Array.isArray(rule?.actions) ? rule.actions.length : 0,
        createdAt: (rule?.createdAt && typeof rule.createdAt === 'string') ? rule.createdAt : new Date().toISOString(),
        updatedAt: (rule?.updatedAt && typeof rule.updatedAt === 'string') ? rule.updatedAt : new Date().toISOString()
      };

      console.log(`🔍 [AUTOMATION-RULES] Mapped rule ${safeRule.id}:`, {
        name: safeRule.name,
        enabled: safeRule.enabled,
        conditions: safeRule.conditionsCount,
        actions: safeRule.actionsCount
      });

      return safeRule;
    });

    const response = {
      success: true,
      rules: mappedRules || [],
      total: rules?.length || 0,
      metadata: {
        responseTime,
        tenantId,
        rulesCount: mappedRules?.length || 0
      }
    };

    console.log(`📤 [AUTOMATION-RULES] Sending response:`, JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [AUTOMATION-RULES] Error fetching rules for tenant ${tenantId}:`, {
      error: error.message,
      stack: error.stack,
      responseTime,
      url: req.url,
      method: req.method
    });

    // Resposta consistente mesmo com erro
    const errorResponse = {
      success: false,
      rules: [],
      total: 0,
      message: 'Failed to fetch automation rules',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Internal server error',
      metadata: {
        responseTime,
        tenantId,
        rulesCount: 0
      }
    };

    console.log(`📤 [AUTOMATION-RULES] Sending error response:`, JSON.stringify(errorResponse, null, 2));
    res.status(500).json(errorResponse);
  }
});

/**
 * Obter métricas de automação (deve vir antes da rota /:ruleId)
 */
router.get('/metrics/overview', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    const automationManager = GlobalAutomationManager.getInstance();
    const engine = automationManager.getEngine(tenantId);
    const metrics = engine.getMetrics();

    res.json({
      success: true,
      metrics: {
        ...metrics,
        rulesCount: engine.getRules().length,
        enabledRulesCount: engine.getRules().filter(r => r.enabled).length
      }
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation metrics'
    });
  }
});

/**
 * Obter regra específica com detalhes completos
 */
router.get('/:ruleId', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { ruleId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    const automationManager = GlobalAutomationManager.getInstance();
    const engine = automationManager.getEngine(tenantId);
    const rule = engine.getRules().find(r => r.id === ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      });
    }

    res.json({
      success: true,
      rule: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        conditions: rule.conditions,
        actions: rule.actions,
        enabled: rule.enabled,
        priority: rule.priority,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error fetching rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation rule'
    });
  }
});

/**
 * Criar nova regra de automação
 */
router.post('/', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, description, conditions, actions, enabled = true, priority = 1 } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    // Validações básicas
    if (!name || !conditions || !actions || conditions.length === 0 || actions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, conditions, and actions are required'
      });
    }

    const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const automationRuleEntity = new AutomationRule(
      ruleId,
      tenantId,
      name,
      description || '',
      conditions,
      actions,
      enabled,
      priority
    );

    const automationManager = GlobalAutomationManager.getInstance();
    const repository = new DrizzleAutomationRuleRepository();

    // Salvar regra no repositório
    const savedRule = await repository.create(automationRuleEntity);

    console.log(`✅ [AUTOMATION-RULES] Rule created successfully: ${savedRule.name} (${savedRule.id})`);

    // Sincronizar com o engine em memória
    try {
      await automationManager.syncRule(tenantId, savedRule.id);
      console.log(`🔄 [AUTOMATION-RULES] Rule synced to engine: ${savedRule.id}`);
    } catch (syncError) {
      console.error(`⚠️ [AUTOMATION-RULES] Failed to sync rule to engine:`, syncError);
    }

    res.status(201).json({
      success: true,
      data: savedRule,
      message: 'Automation rule created successfully'
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error creating rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create automation rule'
    });
  }
});

/**
 * Atualizar regra de automação
 */
router.patch('/:ruleId', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { ruleId } = req.params;
    const updateData = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    const automationManager = GlobalAutomationManager.getInstance();
    const repository = new DrizzleAutomationRuleRepository();

    const updatedRule = await repository.update(ruleId, tenantId, updateData);

    console.log(`✅ [AUTOMATION-RULES] Rule updated successfully: ${updatedRule.name} (${updatedRule.id})`);

    // Sincronizar com o engine em memória
    try {
      await automationManager.syncRule(tenantId, updatedRule.id);
      console.log(`🔄 [AUTOMATION-RULES] Rule synced to engine after update: ${updatedRule.id}`);
    } catch (syncError) {
      console.error(`⚠️ [AUTOMATION-RULES] Failed to sync updated rule to engine:`, syncError);
    }

    res.json({
      success: true,
      data: updatedRule,
      message: 'Automation rule updated successfully'
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error updating rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update automation rule'
    });
  }
});

/**
 * Deletar regra de automação
 */
router.delete('/:ruleId', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { ruleId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    const automationManager = GlobalAutomationManager.getInstance();
    const repository = new DrizzleAutomationRuleRepository();

    // Remover regra do repositório
    const deleted = await repository.delete(ruleId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      });
    }

    // Remover regra do engine em memória após a exclusão do repositório
    try {
      automationManager.removeRuleFromEngine(tenantId, ruleId);
      console.log(`🗑️ [AUTOMATION-RULES] Rule removed from engine: ${ruleId}`);
    } catch (removeError) {
      console.error(`⚠️ [AUTOMATION-RULES] Failed to remove rule from engine:`, removeError);
    }


    console.log(`🗑️ [AUTOMATION-RULES] Deleted rule: ${ruleId} for tenant: ${tenantId}`);

    res.json({
      success: true,
      message: 'Automation rule deleted successfully'
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error deleting rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete automation rule'
    });
  }
});


/**
 * Toggle habilitar/desabilitar regra de automação
 */
router.patch('/:ruleId/toggle', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { ruleId } = req.params;
    const { isEnabled } = req.body; // Espera um booleano para habilitar/desabilitar

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isEnabled property must be a boolean'
      });
    }

    const automationManager = GlobalAutomationManager.getInstance();
    const repository = new DrizzleAutomationRuleRepository();

    const updatedRule = await repository.update(ruleId, { enabled: isEnabled });

    console.log(`✅ [AUTOMATION-RULES] Rule ${isEnabled ? 'enabled' : 'disabled'}: ${updatedRule.name} (${updatedRule.id})`);

    // Sincronizar com o engine em memória
    try {
      await automationManager.syncRule(tenantId, updatedRule.id);
      console.log(`🔄 [AUTOMATION-RULES] Rule synced to engine after toggle: ${updatedRule.id}`);
    } catch (syncError) {
      console.error(`⚠️ [AUTOMATION-RULES] Failed to sync toggled rule to engine:`, syncError);
    }

    res.json({
      success: true,
      data: updatedRule,
      message: `Automation rule ${isEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error toggling rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle automation rule'
    });
  }
});


/**
 * Testar regra com dados simulados
 */
router.post('/:ruleId/test', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { ruleId } = req.params;
    const { testData } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    const automationManager = GlobalAutomationManager.getInstance();
    const engine = automationManager.getEngine(tenantId);
    const rule = engine.getRules().find(r => r.id === ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      });
    }

    const matches = rule.evaluate(testData || {});

    console.log(`🧪 [AUTOMATION-RULES] Test rule ${ruleId}: ${matches ? 'MATCH' : 'NO MATCH'}`);

    res.json({
      success: true,
      test: {
        ruleId: rule.id,
        ruleName: rule.name,
        matches: matches,
        testData: testData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error testing rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test automation rule'
    });
  }
});

/**
 * Processar mensagem do Telegram (webhook)
 */
router.post('/process-message', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId || req.body.tenantId;
    const messageData = req.body;

    console.log(`📨 [AUTOMATION-RULES] Processing Telegram message for tenant: ${tenantId}`);
    console.log(`📨 [AUTOMATION-RULES] Message data:`, JSON.stringify(messageData, null, 2));

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    const automationManager = GlobalAutomationManager.getInstance();
    const engine = automationManager.getEngine(tenantId);

    // Processar mensagem através do engine de automação
    await engine.processMessage({
      type: 'telegram_message',
      content: messageData.message?.text || '',
      sender: messageData.message?.from?.username || 'telegram_user',
      channel: 'telegram',
      timestamp: new Date(messageData.message?.date * 1000).toISOString(),
      metadata: {
        chatId: messageData.message?.chat?.id,
        messageId: messageData.message?.message_id,
        from: messageData.message?.from
      }
    });

    console.log(`✅ [AUTOMATION-RULES] Message processed successfully for tenant: ${tenantId}`);

    res.json({
      success: true,
      message: 'Message processed successfully'
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error processing message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message'
    });
  }
});

export default router;