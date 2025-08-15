
import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { GlobalAutomationManager } from '../modules/omnibridge/infrastructure/services/AutomationEngine';
import { AutomationRule, AutomationCondition, AutomationAction } from '../modules/omnibridge/domain/entities/AutomationRule';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Obter todas as regras de automação do tenant
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
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
    const rules = engine.getRules();

    console.log(`📋 [AUTOMATION-RULES] Retrieved ${rules.length} rules for tenant: ${tenantId}`);

    res.json({
      success: true,
      rules: rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        priority: rule.priority,
        conditionsCount: rule.conditions.length,
        actionsCount: rule.actions.length,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      })),
      total: rules.length
    });
  } catch (error) {
    console.error('❌ [AUTOMATION-RULES] Error fetching rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation rules'
    });
  }
});

/**
 * Obter regra específica com detalhes completos
 */
router.get('/:ruleId', async (req: AuthenticatedRequest, res) => {
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
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, description, conditions, actions, enabled = true, priority = 1 } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found'
      });
    }

    if (!name || !conditions || !actions) {
      return res.status(400).json({
        success: false,
        message: 'Name, conditions, and actions are required'
      });
    }

    const ruleId = uuidv4();
    const automationManager = GlobalAutomationManager.getInstance();
    const engine = automationManager.getEngine(tenantId);

    const newRule = new AutomationRule(
      ruleId,
      tenantId,
      name,
      description || '',
      conditions,
      actions,
      enabled,
      priority
    );

    engine.addRule(newRule);

    console.log(`✅ [AUTOMATION-RULES] Created rule: ${name} (${ruleId}) for tenant: ${tenantId}`);

    res.status(201).json({
      success: true,
      rule: {
        id: newRule.id,
        name: newRule.name,
        description: newRule.description,
        conditions: newRule.conditions,
        actions: newRule.actions,
        enabled: newRule.enabled,
        priority: newRule.priority,
        createdAt: newRule.createdAt,
        updatedAt: newRule.updatedAt
      },
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
 * Deletar regra de automação
 */
router.delete('/:ruleId', async (req: AuthenticatedRequest, res) => {
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
router.post('/:ruleId/test', async (req: AuthenticatedRequest, res) => {
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
 * Obter métricas de automação
 */
router.get('/metrics/overview', async (req: AuthenticatedRequest, res) => {
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

export default router;
