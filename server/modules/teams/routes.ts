
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TeamsController } from './application/controllers/TeamsController';

export function createTeamsRoutes(): Router {
  const router = Router();
  const controller = new TeamsController();

  // Apply JWT authentication to all routes
  router.use(jwtAuth);

  // Team overview and stats routes
  router.get('/overview', (req, res) => controller.getOverview(req, res));
  router.get('/members', (req, res) => controller.getMembers(req, res));
  router.get('/stats', (req, res) => controller.getStats(req, res));
  router.get('/performance', (req, res) => controller.getPerformance(req, res));
  router.get('/skills-matrix', (req, res) => controller.getSkillsMatrix(req, res));
  router.get('/departments', (req, res) => controller.getDepartments(req, res));
  router.get('/roles', (req, res) => controller.getRoles(req, res));

  // Member management routes
  router.put('/members/:id/status', (req, res) => controller.updateMemberStatus(req, res));
  router.put('/members/:id', (req, res) => controller.updateMember(req, res));

  // Sync routes
  router.post('/members/sync', (req, res) => controller.syncTeamData(req, res));

  console.log('✅ Teams module routes registered successfully');
  return router;
}

// Default export for compatibility
export default createTeamsRoutes;
