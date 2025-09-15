
/**
 * Routes for First Company Template Management
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { FirstCompanyTemplateService } from '../services/FirstCompanyTemplateService';

const router = Router();

/**
 * GET /api/first-company-template/status
 * Verifica se o template foi aplicado no tenant
 */
router.get('/status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const isApplied = await FirstCompanyTemplateService.isTemplateAlreadyApplied(tenantId);
    
    res.json({
      success: true,
      data: {
        templateApplied: isApplied,
        tenantId
      }
    });
  } catch (error) {
    console.error('[FIRST-COMPANY-TEMPLATE-STATUS]', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to check template status'
    });
  }
});

/**
 * POST /api/first-company-template/apply/:companyId
 * Força aplicação do template para uma empresa específica
 */
router.post('/apply/:companyId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID and Company ID are required'
      });
    }

    const applied = await FirstCompanyTemplateService.applyTemplateIfFirstCompany(
      tenantId,
      companyId
    );
    
    res.json({
      success: true,
      data: {
        templateApplied: applied,
        companyId,
        tenantId
      }
    });
  } catch (error) {
    console.error('[FIRST-COMPANY-TEMPLATE-APPLY]', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to apply template'
    });
  }
});

export default router;
