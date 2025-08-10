import { Router } from 'express';
import { SkillController } from './application/controllers/SkillController';
import { UserSkillController } from './application/controllers/UserSkillController';
import { jwtAuth } from '../../middleware/jwtAuth';
import { requirePermission } from '../../middleware/rbacMiddleware';

const router = Router();
const skillController = new SkillController();
const userSkillController = new UserSkillController();

// Middleware of authentication for all routes
router.use(jwtAuth);

// Middleware to extract tenantId from authenticated user
router.use((req, res, next) => {
  const user = (req as any).user;
  if (user && user.tenantId) {
    req.headers['x-tenant-id'] = user.tenantId;
  }
  next();
});

// ===================
// SKILLS ROUTES
// ===================

// GET /api/technical-skills/skills - List skills
router.get('/skills', jwtAuth, skillController.getSkills.bind(skillController));

// GET /api/technical-skills/skills/categories - List categories
router.get('/skills/categories', skillController.getCategories.bind(skillController));

// GET /api/technical-skills/skills/statistics - Skills statistics
router.get('/skills/statistics', skillController.getStatistics.bind(skillController));

// GET /api/technical-skills/skills/:id - Find skill by ID
router.get('/skills/:id', skillController.getSkillById.bind(skillController));

// POST /api/technical-skills/skills - Create skill (temporarily without permission check)
router.post('/skills', 
  skillController.createSkill.bind(skillController)
);

// PUT /api/technical-skills/skills/:id - Update skill (temporarily without permission check)
router.put('/skills/:id',
  skillController.updateSkill.bind(skillController)
);

// DELETE /api/technical-skills/skills/:id - Disable skill (temporarily without permission check)
router.delete('/skills/:id',
  skillController.deleteSkill.bind(skillController)
);

// =============================
// USER SKILLS ROUTES
// =============================

// GET /api/technical-skills/user-skills - List user skills
router.get('/user-skills', userSkillController.getUserSkills.bind(userSkillController));

// GET /api/technical-skills/user-skills/user/:userId - Detailed skills of a user
router.get('/user-skills/user/:userId', userSkillController.getUserSkillsDetailed.bind(userSkillController));

// POST /api/technical-skills/user-skills - Assign skill to user (admin/HR only)
router.post('/user-skills',
  requirePermission('tenant', 'manage_skills'),
  userSkillController.assignSkillToUser.bind(userSkillController)
);

// PUT /api/technical-skills/user-skills/:id - Update user skill (admin/HR only)
router.put('/user-skills/:id',
  requirePermission('tenant', 'manage_skills'),
  userSkillController.updateUserSkill.bind(userSkillController)
);

// DELETE /api/technical-skills/user-skills/:id - Remove user skill (admin only)
router.delete('/user-skills/:id',
  requirePermission('tenant', 'manage_skills'),
  userSkillController.removeUserSkill.bind(userSkillController)
);

// POST /api/technical-skills/user-skills/:id/evaluate - Evaluate user skill
router.post('/user-skills/:id/evaluate', userSkillController.evaluateUserSkill.bind(userSkillController));

// ===================
// REPORTS ROUTES
// ===================

// GET /api/technical-skills/certifications/expired - Expired certifications
router.get('/certifications/expired', userSkillController.getExpiredCertifications.bind(userSkillController));

// GET /api/technical-skills/certifications/expiring - Expiring certifications
router.get('/certifications/expiring', userSkillController.getExpiringCertifications.bind(userSkillController));

// GET /api/technical-skills/technicians/top-rated - Top-rated technicians
router.get('/technicians/top-rated', userSkillController.getTopRatedTechnicians.bind(userSkillController));

// GET /api/technical-skills/analysis/skill-gap - Skill gap analysis
router.get('/analysis/skill-gap', userSkillController.getSkillGapAnalysis.bind(userSkillController));

// POST /api/technical-skills/technicians/find-for-task - Find technicians for task
router.post('/technicians/find-for-task', userSkillController.findTechniciansForTask.bind(userSkillController));

export { router as technicalSkillsRoutes };