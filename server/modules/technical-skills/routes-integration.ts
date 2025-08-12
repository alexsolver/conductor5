/**
 * Technical Skills Integration Routes - Phase 9 Implementation
 * 
 * Dual-system integration following Clean Architecture patterns
 * Provides working endpoints and legacy compatibility for skills management
 * 
 * @module TechnicalSkillsIntegration
 * @version 1.0.0
 * @created 2025-08-12 - Phase 9 Clean Architecture Implementation
 */

import { Router, Request, Response } from 'express';
import technicalSkillsWorkingRoutes from './routes-working';
import { technicalSkillsRoutes as technicalSkillsLegacyRoutes } from './routes'; // Existing legacy routes

const router = Router();

/**
 * Phase 9 Status Endpoint
 * GET /status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    system: 'technical-skills-integration',
    architecture: 'Clean Architecture + Working Implementation',
    version: '1.0.0',
    phase: 9,
    components: {
      workingImplementation: {
        status: 'active',
        path: '/working',
        description: 'Phase 9 working implementation for technical skills management'
      },
      legacySystem: {
        status: 'available',
        path: '/legacy',
        description: 'Original technical skills routes preserved for compatibility'
      }
    },
    endpoints: {
      primary: [
        'GET /working/status - Phase 9 status',
        'POST /working/skills - Create technical skill',
        'GET /working/skills - List skills',
        'GET /working/skills/:id - Get skill by ID',
        'PUT /working/skills/:id - Update skill',
        'DELETE /working/skills/:id - Delete skill',
        'POST /working/user-skills - Create user skill assignment',
        'GET /working/user-skills - List user skills',
        'GET /working/user-skills/user/:userId - Get skills by user',
        'DELETE /working/user-skills/:id - Remove user skill'
      ],
      legacy: [
        'Original technical skills routes maintained',
        'Backward compatibility preserved'
      ]
    },
    features: {
      skillsManagement: true,
      userSkillsAssignment: true,
      skillCategories: true,
      proficiencyLevels: true,
      skillValidation: true,
      multiTenancy: true,
      authentication: true,
      brazilianCompliance: true,
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
    phase: 9,
    module: 'technical-skills',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ===== WORKING PHASE 9 ROUTES (PRIMARY) =====

/**
 * Mount Phase 9 working routes as primary system
 * All /working/* routes use the Phase 9 implementation
 */
try {
  console.log('[TECHNICAL-SKILLS-INTEGRATION] Mounting Phase 9 working routes at /working');
  router.use('/', technicalSkillsWorkingRoutes);
} catch (error) {
  console.error('[TECHNICAL-SKILLS-INTEGRATION] Error mounting Phase 9 working routes:', error);
}

// ===== LEGACY ROUTES (COMPATIBILITY) =====

/**
 * Mount legacy routes for backward compatibility
 * All /legacy/* routes use the existing implementation
 */
try {
  console.log('[TECHNICAL-SKILLS-INTEGRATION] Mounting legacy routes at /legacy');
  router.use('/legacy', technicalSkillsLegacyRoutes);
} catch (error) {
  console.error('[TECHNICAL-SKILLS-INTEGRATION] Error mounting legacy routes:', error);
}

export default router;