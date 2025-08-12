/**
 * Inventory Integration Routes - Phase 11 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints for inventory management
 * 
 * @module InventoryIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 11 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import inventoryWorkingRoutes from './routes-working';

const router = Router();

/**
 * Phase 11 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'inventory-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 11,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 11 working implementation for inventory management'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 11 status',
        'POST /working/items - Create inventory item',
        'GET /working/items - List inventory items',
        'GET /working/items/:id - Get item by ID',
        'PUT /working/items/:id - Update item',
        'DELETE /working/items/:id - Delete item',
        'POST /working/items/:id/adjust-stock - Adjust stock',
        'GET /working/statistics - Get inventory statistics',
        'GET /working/low-stock - Get low stock items'
      ]
    },
    features: {
      inventoryManagement: true,
      stockControl: true,
      stockMovements: true,
      inventoryStatistics: true,
      lowStockAlerts: true,
      expirationTracking: true,
      supplierManagement: true,
      locationTracking: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
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
    phase: 11,
    module: 'inventory',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 11 ROUTES (PRIMARY) =====

/**
 * Mount Phase 11 working routes as primary system
 * All routes use the Phase 11 implementation
 */
try {
  console.log('[INVENTORY-INTEGRATION] Mounting Phase 11 working routes at /working');
  router.use('/', inventoryWorkingRoutes);
} catch (error) {
  console.error('[INVENTORY-INTEGRATION] Error mounting Phase 11 working routes:', error);
}

export default router;