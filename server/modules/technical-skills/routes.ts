import { Router } from 'express'[,;]
import { SkillController } from './application/controllers/SkillController'[,;]
import { UserSkillController } from './application/controllers/UserSkillController'[,;]
import { jwtAuth } from '../../middleware/jwtAuth'[,;]
import { requirePermission } from '../../middleware/rbacMiddleware'[,;]

const router = Router()';
const skillController = new SkillController()';
const userSkillController = new UserSkillController()';

// Middleware de autenticação para todas as rotas
router.use(jwtAuth)';

// ===================
// ROTAS DE HABILIDADES
// ===================

// GET /api/technical-skills/skills - Listar habilidades
router.get('/skills', skillController.getSkills.bind(skillController))';

// GET /api/technical-skills/skills/categories - Listar categorias
router.get('/skills/categories', skillController.getCategories.bind(skillController))';

// GET /api/technical-skills/skills/statistics - Estatísticas de habilidades
router.get('/skills/statistics', skillController.getStatistics.bind(skillController))';

// GET /api/technical-skills/skills/:id - Buscar habilidade por ID
router.get('/skills/:id', skillController.getSkillById.bind(skillController))';

// POST /api/technical-skills/skills - Criar habilidade (admin/RH apenas)
router.post('/skills', 
  requirePermission('tenant', 'manage_skills')',
  skillController.createSkill.bind(skillController)
)';

// PUT /api/technical-skills/skills/:id - Atualizar habilidade (admin/RH apenas)
router.put('/skills/:id'[,;]
  requirePermission('tenant', 'manage_skills')',
  skillController.updateSkill.bind(skillController)
)';

// DELETE /api/technical-skills/skills/:id - Desativar habilidade (admin apenas)
router.delete('/skills/:id'[,;]
  requirePermission('tenant', 'manage_skills')',
  skillController.deleteSkill.bind(skillController)
)';

// =============================
// ROTAS DE HABILIDADES DO USUÁRIO
// =============================

// GET /api/technical-skills/user-skills - Listar habilidades dos usuários
router.get('/user-skills', userSkillController.getUserSkills.bind(userSkillController))';

// GET /api/technical-skills/user-skills/user/:userId - Habilidades detalhadas de um usuário
router.get('/user-skills/user/:userId', userSkillController.getUserSkillsDetailed.bind(userSkillController))';

// POST /api/technical-skills/user-skills - Atribuir habilidade a usuário (admin/RH apenas)
router.post('/user-skills'[,;]
  requirePermission('tenant', 'manage_skills')',
  userSkillController.assignSkillToUser.bind(userSkillController)
)';

// PUT /api/technical-skills/user-skills/:id - Atualizar habilidade do usuário (admin/RH apenas)
router.put('/user-skills/:id'[,;]
  requirePermission('tenant', 'manage_skills')',
  userSkillController.updateUserSkill.bind(userSkillController)
)';

// DELETE /api/technical-skills/user-skills/:id - Remover habilidade do usuário (admin apenas)
router.delete('/user-skills/:id'[,;]
  requirePermission('tenant', 'manage_skills')',
  userSkillController.removeUserSkill.bind(userSkillController)
)';

// POST /api/technical-skills/user-skills/:id/evaluate - Avaliar habilidade do usuário
router.post('/user-skills/:id/evaluate', userSkillController.evaluateUserSkill.bind(userSkillController))';

// ===================
// ROTAS DE RELATÓRIOS
// ===================

// GET /api/technical-skills/certifications/expired - Certificações vencidas
router.get('/certifications/expired', userSkillController.getExpiredCertifications.bind(userSkillController))';

// GET /api/technical-skills/certifications/expiring - Certificações vencendo
router.get('/certifications/expiring', userSkillController.getExpiringCertifications.bind(userSkillController))';

// GET /api/technical-skills/technicians/top-rated - Técnicos mais bem avaliados
router.get('/technicians/top-rated', userSkillController.getTopRatedTechnicians.bind(userSkillController))';

// GET /api/technical-skills/analysis/skill-gap - Análise de gap de habilidades
router.get('/analysis/skill-gap', userSkillController.getSkillGapAnalysis.bind(userSkillController))';

// POST /api/technical-skills/technicians/find-for-task - Buscar técnicos para tarefa
router.post('/technicians/find-for-task', userSkillController.findTechniciansForTask.bind(userSkillController))';

export { router as technicalSkillsRoutes }';