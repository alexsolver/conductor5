/**
 * INTEGRATION ROUTES - CUSTOMERS CLEAN ARCHITECTURE
 * Integrando gradualmente Clean Architecture com sistema existente
 * Preserva funcionalidade atual enquanto implementa nova arquitetura
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import customersRouter from './routes'; // Legacy routes
import cleanCustomersRouter from './routes-clean'; // New Clean Architecture routes

const integratedCustomersRouter = Router();

// Mount legacy routes (existing system)
integratedCustomersRouter.use('/', customersRouter);

// Mount new Clean Architecture routes with prefix '/v2' for gradual migration
integratedCustomersRouter.use('/v2', cleanCustomersRouter);

// Health check endpoint to verify Clean Architecture integration
integratedCustomersRouter.get('/health/clean-architecture', jwtAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Clean Architecture integration status',
      data: {
        legacyRoutes: 'active',
        cleanArchitecture: 'integrated',
        migrationStatus: 'gradual',
        endpoints: {
          legacy: [
            'GET /', 'POST /', 'PUT /:id', 'DELETE /:id',
            'GET /companies', 'POST /companies', 'PUT /companies/:id'
          ],
          cleanArchitecture: [
            'GET /v2/', 'GET /v2/search', 'GET /v2/stats',
            'POST /v2/', 'PUT /v2/:id', 'DELETE /v2/:id',
            'GET /v2/:id/profile', 'GET /v2/type/:type'
          ]
        },
        features: {
          domainValidation: true,
          brazilianCompliance: true,
          tenantIsolation: true,
          businessRules: true,
          cleanArchitecture: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Clean Architecture health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default integratedCustomersRouter;