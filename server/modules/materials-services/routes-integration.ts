/**
 * Materials Services Integration Routes - Phase 14 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for materials and services management
 * 
 * @module MaterialsServicesIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 14 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import materialsServicesWorkingRoutes from './routes-working';

const router = Router();

/**
 * Phase 14 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'materials-services-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 14,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 14 working implementation for materials and services management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 14 status',
        'POST /working/materials-services - Create material/service',
        'GET /working/materials-services - List materials/services',
        'GET /working/materials-services/:id - Get material/service by ID',
        'PUT /working/materials-services/:id - Update material/service',
        'DELETE /working/materials-services/:id - Delete material/service',
        'GET /working/search - Search materials/services',
        'GET /working/statistics - Get materials/services statistics',
        'PUT /working/materials-services/:id/stock - Update stock',
        'PUT /working/materials-services/:id/price - Update price',
        'POST /working/materials-services/:id/tags - Add tag',
        'DELETE /working/materials-services/:id/tags - Remove tag'
      ]
    },
    features: {
      materialsManagement: true,
      servicesManagement: true,
      inventoryControl: true,
      stockManagement: true,
      priceManagement: true,
      supplierManagement: true,
      brandManagement: true,
      locationTracking: true,
      barcodeSupport: true,
      serialNumberTracking: true,
      expirationManagement: true,
      tagsSystem: true,
      searchAndFiltering: true,
      duplicateDetection: true,
      stockAlerts: true,
      priceHistory: true,
      stockMovements: true,
      materialsStatistics: true,
      bulkOperations: true,
      importExport: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
    },
    validations: {
      codeValidation: true,
      barcodeValidation: true,
      priceValidation: true,
      stockValidation: true,
      expirationValidation: true,
      businessRules: true,
      typeValidation: true
    },
    businessLogic: {
      materialVsService: 'Different validation rules for materials and services',
      stockControl: 'Only materials can have stock control',
      expiration: 'Only materials can have expiration dates',
      serialNumbers: 'Only materials can have serial numbers',
      suppliers: 'Both materials and services can have suppliers',
      pricing: 'Both support unit pricing and price history'
    },
    lastUpdated: new Date().toISOString()
  });
});

/**
 * Health Check Endpoint
 * GET /health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    phase: 14,
    module: 'materials-services',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 14 ROUTES (PRIMARY) =====

/**
 * Mount Phase 14 working routes as primary system
 * All routes use the Phase 14 implementation
 */
try {
  console.log('[MATERIALS-SERVICES-INTEGRATION] Mounting Phase 14 working routes at /working');
  router.use('/', materialsServicesWorkingRoutes);
} catch (error) {
  console.error('[MATERIALS-SERVICES-INTEGRATION] Error mounting Phase 14 working routes:', error);
}

export default router;