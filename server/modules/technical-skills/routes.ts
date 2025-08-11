
import { Router } from 'express';
import { TechnicalSkillsController } from './application/controllers/TechnicalSkillsController';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const controller = new TechnicalSkillsController();

// Clean architecture pattern
router.get('/skills', jwtAuth, (req, res) => controller.getSkills(req, res));
router.post('/skills', jwtAuth, (req, res) => controller.createSkill(req, res));
router.get('/user-skills', jwtAuth, (req, res) => controller.getUserSkills(req, res));
router.post('/user-skills', jwtAuth, (req, res) => controller.createUserSkill(req, res));

export const technicalSkillsRoutes = router;
export default router;
