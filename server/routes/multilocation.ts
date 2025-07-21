// MULTILOCATION API ROUTES
// API endpoints para gerenciamento multilocation
// Integração com sistema de localização existente

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { MultilocationService } from '../services/multilocationService';
import { pool } from '../db';

const router = Router();
const multilocationService = new MultilocationService(pool);

/**
 * GET /api/multilocation/markets
 * Get available markets for tenant
 */
router.get('/markets', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const markets = await pool.query(
      `SELECT market_code, country_code, language_code, currency_code, is_active
       FROM market_localization 
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY market_code`,
      [tenantId]
    );

    res.json({
      markets: markets.rows,
      defaultMarket: 'BR'
    });
  } catch (error) {
    console.error('Error getting markets:', error);
    res.status(500).json({ error: 'Failed to get markets' });
  }
});

/**
 * GET /api/multilocation/config/:marketCode
 * Get market configuration for specific market
 */
router.get('/config/:marketCode', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { marketCode } = req.params;
    const tenantId = req.user!.tenantId;

    const config = await multilocationService.getMarketConfig(tenantId, marketCode || undefined);

    res.json({
      marketCode,
      config
    });
  } catch (error) {
    console.error('Error getting market config:', error);
    res.status(500).json({ error: 'Failed to get market configuration' });
  }
});

/**
 * GET /api/multilocation/form-config/:formId
 * Get localized form configuration
 */
router.get('/form-config/:formId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { formId } = req.params;
    const { marketCode = 'BR', languageCode = 'pt-BR' } = req.query;
    const tenantId = req.user!.tenantId;

    const context = {
      tenantId,
      marketCode: (marketCode as string) || 'BR',
      languageCode: (languageCode as string) || 'pt-BR'
    };

    const formConfig = await multilocationService.getLocalizedFormConfig(tenantId, formId, context);

    res.json({
      formId,
      formConfig
    });
  } catch (error) {
    console.error('Error getting form config:', error);
    res.status(500).json({ error: 'Failed to get form configuration' });
  }
});

/**
 * POST /api/multilocation/validate-field
 * Validate field according to market rules
 */
router.post('/validate-field', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { fieldName, value, marketCode = 'BR', languageCode = 'pt-BR' } = req.body;
    const tenantId = req.user!.tenantId;

    if (!fieldName || value === undefined) {
      return res.status(400).json({ error: 'fieldName and value are required' });
    }

    const context = {
      tenantId,
      marketCode: marketCode || 'BR',
      languageCode: languageCode || 'pt-BR'
    };

    const validation = await multilocationService.validateField(tenantId, fieldName, value, context);

    res.json({
      fieldName,
      value,
      marketCode,
      validation
    });
  } catch (error) {
    console.error('Error validating field:', error);
    res.status(500).json({ error: 'Failed to validate field' });
  }
});

/**
 * GET /api/multilocation/aliases/:tableName
 * Get field aliases for table
 */
router.get('/aliases/:tableName', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { tableName } = req.params;
    const { marketCode = 'BR' } = req.query;
    const tenantId = req.user!.tenantId;

    const aliases = await multilocationService.getFieldAliases(tenantId, tableName, (marketCode as string) || 'BR');

    res.json({
      tableName,
      marketCode,
      aliases
    });
  } catch (error) {
    console.error('Error getting aliases:', error);
    res.status(500).json({ error: 'Failed to get field aliases' });
  }
});

/**
 * POST /api/multilocation/initialize-market
 * Initialize market configuration for tenant
 */
router.post('/initialize-market', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { marketCode = 'BR' } = req.body;
    const tenantId = req.user!.tenantId;

    await multilocationService.initializeTenantMarketConfig(tenantId, marketCode);

    res.json({
      success: true,
      message: `Market configuration initialized for ${marketCode}`,
      marketCode,
      tenantId
    });
  } catch (error) {
    console.error('Error initializing market:', error);
    res.status(500).json({ error: 'Failed to initialize market configuration' });
  }
});

/**
 * GET /api/multilocation/localization-context/:contextKey
 * Get localization context for forms/displays
 */
router.get('/localization-context/:contextKey', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { contextKey } = req.params;
    const { marketCode = 'BR', languageCode = 'pt-BR' } = req.query;
    const tenantId = req.user!.tenantId;

    const context = await pool.query(
      `SELECT * FROM localization_context 
       WHERE tenant_id = $1 AND context_key = $2 AND market_code = $3 AND is_active = true`,
      [tenantId, contextKey, (marketCode as string) || 'BR']
    );

    if (context.rows.length === 0) {
      return res.status(404).json({ error: 'Localization context not found' });
    }

    const row = context.rows[0];
    const localization = {
      contextKey,
      contextType: row.context_type,
      marketCode: row.market_code,
      labels: row.labels[languageCode as string] || {},
      placeholders: row.placeholders[languageCode as string] || {},
      helpTexts: row.help_texts[languageCode as string] || {}
    };

    res.json({ localization });
  } catch (error) {
    console.error('Error getting localization context:', error);
    res.status(500).json({ error: 'Failed to get localization context' });
  }
});

/**
 * PUT /api/multilocation/localization-context/:contextKey
 * Update localization context
 */
router.put('/localization-context/:contextKey', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { contextKey } = req.params;
    const { marketCode = 'BR', labels = {}, placeholders = {}, helpTexts = {} } = req.body;
    const tenantId = req.user!.tenantId;

    // Check if context exists
    const existing = await pool.query(
      `SELECT * FROM localization_context 
       WHERE tenant_id = $1 AND context_key = $2 AND market_code = $3`,
      [tenantId, contextKey, marketCode]
    );

    if (existing.rows.length === 0) {
      // Create new context
      await pool.query(
        `INSERT INTO localization_context 
         (tenant_id, context_key, context_type, market_code, labels, placeholders, help_texts)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, contextKey, 'form', marketCode, 
         JSON.stringify(labels), JSON.stringify(placeholders), JSON.stringify(helpTexts)]
      );
    } else {
      // Update existing context
      const row = existing.rows[0];
      const updatedLabels = { ...row.labels, ...labels };
      const updatedPlaceholders = { ...row.placeholders, ...placeholders };
      const updatedHelpTexts = { ...row.help_texts, ...helpTexts };

      await pool.query(
        `UPDATE localization_context 
         SET labels = $1, placeholders = $2, help_texts = $3, updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $4 AND context_key = $5 AND market_code = $6`,
        [
          JSON.stringify(updatedLabels), 
          JSON.stringify(updatedPlaceholders), 
          JSON.stringify(updatedHelpTexts),
          tenantId, contextKey, marketCode
        ]
      );
    }

    res.json({
      success: true,
      message: 'Localization context updated successfully'
    });
  } catch (error) {
    console.error('Error updating localization context:', error);
    res.status(500).json({ error: 'Failed to update localization context' });
  }
});

export default router;