/**
 * Teams Working Routes - Phase 10 Implementation
 * 
 * Simplified working implementation for Phase 10 completion
 * Manages teams with Clean Architecture principles
 * 
 * @module TeamsWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 10 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';
import { TeamController } from './application/controllers/TeamController';
import { SimplifiedTeamRepository } from './infrastructure/repositories/SimplifiedTeamRepository';

const router = Router();

// Initialize dependencies
const teamRepository = new SimplifiedTeamRepository();
const teamController = new TeamController(teamRepository);

// Apply authentication middleware
router.use(jwtAuth);

/**
 * Phase 10 Status Endpoint
 * GET /working/status
 */
router.get('/working/status', (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    phase: 10,
    module: 'teams',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      teams: {
        create: 'POST /working/teams',
        list: 'GET /working/teams',
        getById: 'GET /working/teams/:id',
        update: 'PUT /working/teams/:id',
        delete: 'DELETE /working/teams/:id',
        statistics: 'GET /working/teams/statistics',
        types: 'GET /working/teams/types'
      }
    },
    features: {
      teamsManagement: true,
      teamTypes: true,
      workingHours: true,
      teamValidation: true,
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Create team - Working implementation
 * POST /working/teams
 */
router.post('/working/teams', async (req: AuthenticatedRequest, res) => {
  await teamController.createTeam(req, res);
});

/**
 * List teams - Working implementation
 * GET /working/teams
 */
router.get('/working/teams', async (req: AuthenticatedRequest, res) => {
  await teamController.getTeams(req, res);
});

/**
 * Get team by ID - Working implementation
 * GET /working/teams/:id
 */
router.get('/working/teams/:id', async (req: AuthenticatedRequest, res) => {
  await teamController.getTeamById(req, res);
});

/**
 * Update team - Working implementation
 * PUT /working/teams/:id
 */
router.put('/working/teams/:id', async (req: AuthenticatedRequest, res) => {
  await teamController.updateTeam(req, res);
});

/**
 * Delete team - Working implementation
 * DELETE /working/teams/:id
 */
router.delete('/working/teams/:id', async (req: AuthenticatedRequest, res) => {
  await teamController.deleteTeam(req, res);
});

/**
 * Get team statistics - Working implementation
 * GET /working/teams/statistics
 */
router.get('/working/teams/statistics', async (req: AuthenticatedRequest, res) => {
  await teamController.getTeamStatistics(req, res);
});

/**
 * Get team types - Working implementation
 * GET /working/teams/types
 */
router.get('/working/teams/types', async (req: AuthenticatedRequest, res) => {
  await teamController.getTeamTypes(req, res);
});

export default router;