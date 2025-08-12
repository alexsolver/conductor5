/**
 * Inventory Working Routes - Phase 11 Implementation
 * 
 * Working implementation for Phase 11 completion
 * Manages inventory with Clean Architecture principles
 * 
 * @module InventoryWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 11 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { InventoryController } from './application/controllers/InventoryController';
import { SimplifiedInventoryRepository } from './infrastructure/repositories/SimplifiedInventoryRepository';

const router = Router();

// Initialize dependencies
const inventoryRepository = new SimplifiedInventoryRepository();
const inventoryController = new InventoryController(inventoryRepository);

// Apply authentication middleware
router.use(jwtAuth);

/**
 * Phase 11 Status Endpoint
 * GET /working/status
 */
router.get('/working/status', (req, res) => {
  res.json({
    success: true,
    phase: 11,
    module: 'inventory',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      items: {
        create: 'POST /working/items',
        list: 'GET /working/items',
        getById: 'GET /working/items/:id',
        update: 'PUT /working/items/:id',
        delete: 'DELETE /working/items/:id',
        adjustStock: 'POST /working/items/:id/adjust-stock',
        statistics: 'GET /working/statistics',
        lowStock: 'GET /working/low-stock'
      }
    },
    features: {
      inventoryManagement: true,
      stockControl: true,
      stockMovements: true,
      inventoryValidation: true,
      expirationTracking: true,
      supplierManagement: true,
      locationTracking: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Create inventory item - Working implementation
 * POST /working/items
 */
router.post('/working/items', async (req, res) => {
  await inventoryController.createItem(req, res);
});

/**
 * List inventory items - Working implementation
 * GET /working/items
 */
router.get('/working/items', async (req, res) => {
  await inventoryController.getItems(req, res);
});

/**
 * Get inventory item by ID - Working implementation
 * GET /working/items/:id
 */
router.get('/working/items/:id', async (req, res) => {
  await inventoryController.getItemById(req, res);
});

/**
 * Update inventory item - Working implementation
 * PUT /working/items/:id
 */
router.put('/working/items/:id', async (req, res) => {
  await inventoryController.updateItem(req, res);
});

/**
 * Delete inventory item - Working implementation
 * DELETE /working/items/:id
 */
router.delete('/working/items/:id', async (req, res) => {
  await inventoryController.deleteItem(req, res);
});

/**
 * Adjust stock - Working implementation
 * POST /working/items/:id/adjust-stock
 */
router.post('/working/items/:id/adjust-stock', async (req, res) => {
  await inventoryController.adjustStock(req, res);
});

/**
 * Get inventory statistics - Working implementation
 * GET /working/statistics
 */
router.get('/working/statistics', async (req, res) => {
  await inventoryController.getStatistics(req, res);
});

/**
 * Get low stock items - Working implementation
 * GET /working/low-stock
 */
router.get('/working/low-stock', async (req, res) => {
  await inventoryController.getLowStockItems(req, res);
});

export default router;