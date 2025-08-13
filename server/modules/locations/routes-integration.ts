/**
 * Location Clean Architecture Routes
 * 
 * Consolidated to use only Clean Architecture pattern
 * Following 1qa.md specifications strictly
 * 
 * @module LocationRoutes
 * @version 2.0.0
 * @created 2025-01-12 - Clean Architecture Consolidation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import locationRoutesClean from './routes-clean';

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// ==========================================
// CLEAN ARCHITECTURE ROUTES ONLY
// ==========================================

// Use Clean Architecture routes directly
router.use('/', locationRoutesClean);

router.post('/', async (req, res, next) => {
  try {
    // Try Clean Architecture first for POST operations
    await locationRoutesClean.stack[0].handle(req, res, (err: any) => {
      if (err) {
        console.log('[LOCATION-INTEGRATION] Clean Architecture POST failed, trying legacy');
        if (legacyRoutes) {
          return legacyRoutes.handle(req, res, next);
        }
        return next(err);
      }
    });
  } catch (error) {
    console.error('[LOCATION-INTEGRATION] Integration POST error:', error);
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    // Try Clean Architecture first
    await locationRoutesClean.stack.find((layer: any) => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.get
    )?.handle(req, res, (err: any) => {
      if (err) {
        console.log('[LOCATION-INTEGRATION] Clean Architecture GET by ID failed, trying legacy');
        if (legacyRoutes) {
          return legacyRoutes.handle(req, res, next);
        }
        return next(err);
      }
    });
  } catch (error) {
    console.error('[LOCATION-INTEGRATION] Integration GET by ID error:', error);
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    // Try Clean Architecture first
    await locationRoutesClean.stack.find((layer: any) => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.put
    )?.handle(req, res, (err: any) => {
      if (err) {
        console.log('[LOCATION-INTEGRATION] Clean Architecture PUT failed, trying legacy');
        if (legacyRoutes) {
          return legacyRoutes.handle(req, res, next);
        }
        return next(err);
      }
    });
  } catch (error) {
    console.error('[LOCATION-INTEGRATION] Integration PUT error:', error);
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    // Try Clean Architecture first
    await locationRoutesClean.stack.find((layer: any) => 
      layer.route && layer.route.path === '/:id' && layer.route.methods.delete
    )?.handle(req, res, (err: any) => {
      if (err) {
        console.log('[LOCATION-INTEGRATION] Clean Architecture DELETE failed, trying legacy');
        if (legacyRoutes) {
          return legacyRoutes.handle(req, res, next);
        }
        return next(err);
      }
    });
  } catch (error) {
    console.error('[LOCATION-INTEGRATION] Integration DELETE error:', error);
    next(error);
  }
});

// === Status and Health Check ===

/**
 * Integration status endpoint
 * GET /api/locations-integration/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    integration: 'active',
    systems: {
      cleanArchitecture: 'active',
      legacy: legacyRoutes ? 'available' : 'not_available'
    },
    version: '1.0.0',
    endpoints: {
      primary: '/api/locations-integration',
      cleanArchitecture: '/api/locations-integration/v2',
      legacy: legacyRoutes ? '/api/locations-integration/legacy' : 'not_available'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Legacy system access (if available)
 * All methods: /api/locations-integration/legacy/*
 */
if (legacyRoutes) {
  router.use('/legacy', legacyRoutes);
}

// === Error Handling ===
router.use((err: any, req: any, res: any, next: any) => {
  console.error('[LOCATION-INTEGRATION] Integration error:', err);
  res.status(500).json({
    success: false,
    error: 'Location integration error',
    message: 'Failed to process request through location integration layer',
    timestamp: new Date().toISOString()
  });
});

export default router;