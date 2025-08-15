import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { GlobalAutomationManager } from '../modules/omnibridge/infrastructure/services/AutomationEngine';
import { AutomationRule, AutomationCondition, AutomationAction } from '../modules/omnibridge/domain/entities/AutomationRule';

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

    const mappedRules = rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      priority: rule.priority,
      conditionsCount: rule.conditions.length,
      actionsCount: rule.actions.length,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    }));

    res.json({
      success: true,
      rules: mappedRules,
      total: rules.length,
      metadata: {
        responseTime,
        tenantId
      }
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [AUTOMATION-RULES] Error fetching rules for tenant ${tenantId}:`, {
      error: error.message,
      stack: error.stack,
      responseTime
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation rules',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      metadata: {
        responseTime,
        tenantId
      }
    });
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

    const rule = new AutomationRule(
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
    const engine = automationManager.getEngine(tenantId);
    engine.addRule(rule);

    console.log(`✅ [AUTOMATION-RULES] Created rule: ${name} (${ruleId}) for tenant: ${tenantId}`);

    res.status(201).json({
      success: true,
      message: 'Automation rule created successfully',
      rule: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        priority: rule.priority,
        conditionsCount: rule.conditions.length,
        actionsCount: rule.actions.length,
        createdAt: rule.createdAt
      }
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
    const engine = automationManager.getEngine(tenantId);
    const deleted = engine.removeRule(ruleId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      });
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

export default router;