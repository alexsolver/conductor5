/**
 * Location Integration Routes
 * 
 * Provides dual-system integration for Location management,
 * maintaining backward compatibility while introducing Clean Architecture.
 * 
 * @module LocationIntegrationRoutes
 * @version 1.0.0
 * @created 2025-01-12 - Phase 6 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import locationRoutesClean from './routes-clean';

// Import legacy routes if they exist
let legacyRoutes: Router;
try {
  legacyRoutes = require('./routes').default;
} catch {
  console.log('[LOCATION-INTEGRATION] Legacy routes not found - using Clean Architecture only');
  legacyRoutes = Router();
}

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// === Integration Strategy ===

/**
 * Main locations endpoints
 * Primary: Clean Architecture (v2)
 * Fallback: Legacy system
 * 
 * GET  /api/locations-integration     -> Clean Architecture (with legacy fallback)
 * POST /api/locations-integration     -> Clean Architecture (with legacy fallback)  
 * GET  /api/locations-integration/:id -> Clean Architecture (with legacy fallback)
 * PUT  /api/locations-integration/:id -> Clean Architecture (with legacy fallback)
 * DELETE /api/locations-integration/:id -> Clean Architecture (with legacy fallback)
 */

// Clean Architecture endpoints with integration wrapper
router.use('/v2', locationRoutesClean);

// Integrated endpoints (Clean Architecture with legacy fallback)
router.get('/', async (req, res, next) => {
  try {
    // Try Clean Architecture first
    await locationRoutesClean.stack[1].handle(req, res, (err: any) => {
      if (err) {
        console.log('[LOCATION-INTEGRATION] Clean Architecture failed, trying legacy');
        // Fallback to legacy if available
        if (legacyRoutes) {
          return legacyRoutes.handle(req, res, next);
        }
        return next(err);
      }
    });
  } catch (error) {
    console.error('[LOCATION-INTEGRATION] Integration error:', error);
    next(error);
  }
});

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