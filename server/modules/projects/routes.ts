
import { Router } from 'express';
import { ProjectController } from './application/controllers/ProjectController';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const projectController = new ProjectController();

// Projects
router.post('/projects', jwtAuth, (req, res) => projectController.createProject(req, res));
router.get('/projects', jwtAuth, (req, res) => projectController.getProjects(req, res));
router.get('/projects/stats', jwtAuth, (req, res) => projectController.getProjectStats(req, res));
router.get('/projects/:id', jwtAuth, (req, res) => projectController.getProject(req, res));
router.put('/projects/:id', jwtAuth, (req, res) => projectController.updateProject(req, res));
router.delete('/projects/:id', jwtAuth, (req, res) => projectController.deleteProject(req, res));
router.get('/projects/:id/timeline', jwtAuth, (req, res) => projectController.getProjectTimeline(req, res));

// Project Actions
router.post('/projects/:projectId/actions', jwtAuth, (req, res) => projectController.createAction(req, res));
router.get('/projects/:projectId/actions', jwtAuth, (req, res) => projectController.getProjectActions(req, res));
router.get('/actions', jwtAuth, (req, res) => projectController.getAllActions(req, res));
router.get('/actions/:id', jwtAuth, (req, res) => projectController.getAction(req, res));
router.put('/actions/:id', jwtAuth, (req, res) => projectController.updateAction(req, res));
router.delete('/actions/:id', jwtAuth, (req, res) => projectController.deleteAction(req, res));
router.get('/actions/:id/dependencies', jwtAuth, (req, res) => projectController.getActionDependencies(req, res));

export default router;
