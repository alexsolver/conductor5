/**
 * Tenant Auto-Provisioning API Routes
 * Handles automatic tenant creation endpoints
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { tenantAutoProvisioningService } from '../services/TenantAutoProvisioningService';
import { validateRequestBody, jsonErrorHandler } from '../middleware/requestBodyValidator';
import { z } from 'zod';

const router = Router();

// Apply body validation middleware
router.use(validateRequestBody);
router.use(jsonErrorHandler);

// Schema for manual tenant provisioning
const provisionTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  subdomain: z.string().optional(),
  companyName: z.string().optional(),
  settings: z.record(z.any()).optional(),
  trigger: z.enum(['manual', 'registration', 'invitation', 'api']).default('manual')
});

// Schema for auto-provisioning configuration
const configSchema = z.object({
  enabled: z.boolean(),
  allowSelfProvisioning: z.boolean(),
  defaultTenantSettings: z.record(z.any()),
  autoCreateOnFirstUser: z.boolean(),
  subdomainGeneration: z.enum(['random', 'company-based', 'user-based'])
});

/**
 * POST /api/tenant-provisioning/provision
 * Manually provision a new tenant
 */
router.post('/provision', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can manually provision tenants
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const validationResult = provisionTenantSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const result = await tenantAutoProvisioningService.provisionTenant({
      ...validationResult.data,
      userEmail: req.user.email
    });

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: result.message,
        tenant: result.tenant
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Error in manual tenant provisioning:', error);
    res.status(500).json({ message: 'Failed to provision tenant' });
  }
});

/**
 * POST /api/tenant-provisioning/provision-for-user
 * Provision tenant for a specific user (registration flow)
 */
router.post('/provision-for-user', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userEmail, userName, companyName } = req.body;

    if (!userEmail || !userName) {
      return res.status(400).json({ message: 'User email and name are required' });
    }

    const result = await tenantAutoProvisioningService.provisionOnUserRegistration(
      userEmail,
      userName,
      companyName
    );

    if (result.success) {
      res.status(201).json({
        message: result.message,
        tenant: result.tenant
      });
    } else {
      res.status(400).json({
        message: result.message
      });
    }

  } catch (error) {
    console.error('Error in user-based tenant provisioning:', error);
    res.status(500).json({ message: 'Failed to provision tenant for user' });
  }
});

/**
 * GET /api/tenant-provisioning/config
 * Get auto-provisioning configuration
 */
router.get('/config', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can view configuration
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const config = tenantAutoProvisioningService.getConfig();
    res.json(config);

  } catch (error) {
    console.error('Error getting auto-provisioning config:', error);
    res.status(500).json({ message: 'Failed to get configuration' });
  }
});

/**
 * PUT /api/tenant-provisioning/config
 * Update auto-provisioning configuration
 */
router.put('/config', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only SaaS admins can update configuration
    if (req.user?.role !== 'saas_admin') {
      return res.status(403).json({ message: 'SaaS admin access required' });
    }

    const validationResult = configSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid configuration data',
        errors: validationResult.error.errors
      });
    }

    tenantAutoProvisioningService.updateConfig(validationResult.data);
    
    res.json({
      message: 'Configuration updated successfully',
      config: tenantAutoProvisioningService.getConfig()
    });

  } catch (error) {
    console.error('Error updating auto-provisioning config:', error);
    res.status(500).json({ message: 'Failed to update configuration' });
  }
});

/**
 * GET /api/tenant-provisioning/check-subdomain/:subdomain
 * Check if subdomain is available
 */
router.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return res.status(400).json({ 
        available: false, 
        message: 'Subdomain must contain only lowercase letters, numbers, and hyphens' 
      });
    }

    const { db } = await import('../db');
    const { tenants } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const existingTenant = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
    
    const isAvailable = existingTenant.length === 0;
    res.json({
      available: isAvailable,
      subdomain,
      message: isAvailable ? 'Subdomain available' : 'Subdomain already taken'
    });

  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    res.status(500).json({ message: 'Failed to check subdomain availability' });
  }
});

export default router;