
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
      legacy: 'consolidated'
    },
    version: '2.0.0',
    endpoints: {
      primary: '/api/locations-integration',
      cleanArchitecture: '/api/locations-integration'
    },
    timestamp: new Date().toISOString()
  });
});

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
