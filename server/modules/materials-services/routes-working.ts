/**
 * Materials Services Working Routes - Phase 14 Implementation
 * 
 * Working implementation for Phase 14 completion
 * Manages materials and services with Clean Architecture principles
 * 
 * @module MaterialsServicesWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 14 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { MaterialServiceController } from './application/controllers/MaterialServiceController';
import { SimplifiedMaterialServiceRepository } from './infrastructure/repositories/SimplifiedMaterialServiceRepository';

const router = Router();

// Initialize dependencies
const materialServiceRepository = new SimplifiedMaterialServiceRepository();
const materialServiceController = new MaterialServiceController(materialServiceRepository);

// Apply authentication middleware
router.use(jwtAuth);

/**
 * Phase 14 Status Endpoint
 * GET /working/status
 */
router.get('/working/status', (req, res) => {
  res.json({
    success: true,
    phase: 14,
    module: 'materials-services',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      materialsServices: {
        create: 'POST /working/materials-services',
        list: 'GET /working/materials-services',
        getById: 'GET /working/materials-services/:id',
        update: 'PUT /working/materials-services/:id',
        delete: 'DELETE /working/materials-services/:id'
      },
      search: 'GET /working/search',
      statistics: 'GET /working/statistics',
      stock: {
        update: 'PUT /working/materials-services/:id/stock'
      },
      price: {
        update: 'PUT /working/materials-services/:id/price'
      },
      tags: {
        add: 'POST /working/materials-services/:id/tags',
        remove: 'DELETE /working/materials-services/:id/tags'
      }
    },
    features: {
      materialsManagement: true,
      servicesManagement: true,
      itemTypes: ['material', 'service'],
      stockControl: {
        materials: true,
        services: false,
        stockLevels: ['minimum', 'maximum', 'current'],
        stockStatuses: ['out_of_stock', 'low_stock', 'over_stock', 'normal']
      },
      priceManagement: {
        unitPricing: true,
        priceHistory: true,
        bulkPriceUpdates: true,
        multiCurrency: ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CLP', 'PEN', 'COP']
      },
      inventoryFeatures: {
        barcodeSupport: true,
        serialNumbers: true,
        expirationDates: true,
        locationTracking: true,
        supplierManagement: true,
        brandModel: true
      },
      searchAndFiltering: {
        textSearch: true,
        typeFiltering: true,
        categoryFiltering: true,
        supplierFiltering: true,
        brandFiltering: true,
        locationFiltering: true,
        priceRangeFiltering: true,
        stockStatusFiltering: true,
        expirationFiltering: true,
        tagsFiltering: true
      },
      duplicateDetection: {
        codeUniqueness: true,
        barcodeUniqueness: true,
        potentialDuplicates: true
      },
      analytics: {
        inventoryStatistics: true,
        categoryDistribution: true,
        supplierDistribution: true,
        brandDistribution: true,
        locationDistribution: true,
        stockValueAnalysis: true,
        topMaterialsByValue: true
      },
      bulkOperations: {
        bulkCreate: true,
        bulkUpdate: true,
        bulkStockUpdate: true,
        bulkPriceUpdate: true,
        import: true,
        export: true
      },
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
    },
    businessRules: {
      materialRequiredFields: ['type', 'category', 'code', 'name', 'unit', 'unitPrice'],
      serviceRequiredFields: ['type', 'category', 'code', 'name', 'unit', 'unitPrice'],
      stockControlRules: 'Only materials can have stock control',
      expirationRules: 'Only materials can have expiration dates',
      serialNumberRules: 'Only materials can have serial numbers',
      codeUniqueness: 'per tenant',
      barcodeUniqueness: 'per tenant',
      priceValidation: 'Must be non-negative',
      stockValidation: 'Must be non-negative for materials'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Create material/service - Working implementation
 * POST /working/materials-services
 */
router.post('/working/materials-services', async (req, res) => {
  await materialServiceController.createMaterialService(req, res);
});

/**
 * List materials/services - Working implementation
 * GET /working/materials-services
 */
router.get('/working/materials-services', async (req, res) => {
  await materialServiceController.getMaterialsServices(req, res);
});

/**
 * Get material/service by ID - Working implementation
 * GET /working/materials-services/:id
 */
router.get('/working/materials-services/:id', async (req, res) => {
  await materialServiceController.getMaterialServiceById(req, res);
});

/**
 * Update material/service - Working implementation
 * PUT /working/materials-services/:id
 */
router.put('/working/materials-services/:id', async (req, res) => {
  await materialServiceController.updateMaterialService(req, res);
});

/**
 * Delete material/service - Working implementation
 * DELETE /working/materials-services/:id
 */
router.delete('/working/materials-services/:id', async (req, res) => {
  await materialServiceController.deleteMaterialService(req, res);
});

/**
 * Search materials/services - Working implementation
 * GET /working/search
 */
router.get('/working/search', async (req, res) => {
  await materialServiceController.searchMaterialsServices(req, res);
});

/**
 * Get materials/services statistics - Working implementation
 * GET /working/statistics
 */
router.get('/working/statistics', async (req, res) => {
  await materialServiceController.getStatistics(req, res);
});

/**
 * Update stock quantity - Working implementation
 * PUT /working/materials-services/:id/stock
 */
router.put('/working/materials-services/:id/stock', async (req, res) => {
  await materialServiceController.updateStock(req, res);
});

/**
 * Update price - Working implementation
 * PUT /working/materials-services/:id/price
 */
router.put('/working/materials-services/:id/price', async (req, res) => {
  await materialServiceController.updatePrice(req, res);
});

/**
 * Add tag to material/service - Working implementation
 * POST /working/materials-services/:id/tags
 */
router.post('/working/materials-services/:id/tags', async (req, res) => {
  await materialServiceController.addTag(req, res);
});

/**
 * Remove tag from material/service - Working implementation
 * DELETE /working/materials-services/:id/tags
 */
router.delete('/working/materials-services/:id/tags', async (req, res) => {
  await materialServiceController.removeTag(req, res);
});

export default router;