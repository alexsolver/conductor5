
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TeamsController } from './application/controllers/TeamsController';

const router = Router();
const teamsController = new TeamsController();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Team management routes using modular controller
router.get('/overview', teamsController.getOverview.bind(teamsController));
router.get('/members', teamsController.getMembers.bind(teamsController));
router.get('/stats', teamsController.getStats.bind(teamsController));
router.get('/performance', teamsController.getPerformance.bind(teamsController));
router.get('/skills-matrix', teamsController.getSkillsMatrix.bind(teamsController));
router.get('/departments', teamsController.getDepartments.bind(teamsController));
router.get('/roles', teamsController.getRoles.bind(teamsController));

// Member management operations
router.put('/members/:id/status', teamsController.updateMemberStatus.bind(teamsController));
router.put('/members/:id', teamsController.updateMember.bind(teamsController));

// Team data synchronization
router.post('/members/sync', teamsController.syncTeamData.bind(teamsController));

export { router as teamsRoutes };
