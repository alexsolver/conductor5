/**
 * COMPANIES MODULE - CLEAN ARCHITECTURE ONLY
 * Consolidated to use only Clean Architecture pattern
 * Following 1qa.md specifications strictly
 */

import { Router } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../../middleware/jwtAuth';

// Clean Architecture imports only
import cleanCompaniesRouter from './routes-clean';

const companiesRouter = Router();

// ==========================================
// CLEAN ARCHITECTURE ROUTES ONLY
// ==========================================

// Use Clean Architecture routes directly
companiesRouter.use('/', cleanCompaniesRouter);

// ==========================================
// CLEAN ARCHITECTURE STATUS ENDPOINT
// ==========================================

// Health check endpoint
companiesRouter.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Companies Clean Architecture operational',
    architecture: {
      cleanArchitecture: {
        status: 'operational',
        description: 'Full Clean Architecture implementation with domain/application/infrastructure layers',
        compliance: '1qa.md'
      }
    },
    migration: {
      status: 'complete',
      strategy: 'clean_architecture_only',
      legacyRoutes: 'eliminated'
    },
    features: {
      multiTenancy: true,
      businessValidation: true,
      auditTrail: true,
      softDelete: true,
      search: true,
      filtering: true
    },
    timestamp: new Date().toISOString()
  });
});

export default companiesRouter;