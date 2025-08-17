// ✅ 1QA.MD COMPLIANCE: Activity Planner Routes - Clean Architecture Presentation Layer
// HTTP routing following exact patterns from existing modules

import { Router } from 'express';
import { ActivityPlannerController } from './application/controllers/ActivityPlannerController';
import { DrizzleActivityPlannerRepository } from './infrastructure/repositories/DrizzleActivityPlannerRepository';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();

// ✅ Dependency Injection - Clean Architecture Pattern
const activityPlannerRepository = new DrizzleActivityPlannerRepository();
const activityPlannerController = new ActivityPlannerController(activityPlannerRepository);

// ✅ All routes require authentication
router.use(jwtAuth);

// ✅ Dashboard & Analytics Routes
router.get('/dashboard-metrics', (req, res) => activityPlannerController.getDashboardMetrics(req, res));

// ✅ Activity Category Routes
router.post('/categories', (req, res) => activityPlannerController.createCategory(req, res));
router.get('/categories', (req, res) => activityPlannerController.getCategories(req, res));
router.put('/categories/:id', (req, res) => activityPlannerController.updateCategory(req, res));
router.delete('/categories/:id', (req, res) => activityPlannerController.deleteCategory(req, res));

// ✅ Activity Template Routes  
router.post('/templates', (req, res) => activityPlannerController.createTemplate(req, res));
router.get('/templates', (req, res) => activityPlannerController.getTemplates(req, res));

// ✅ Activity Schedule Routes
router.post('/schedules', (req, res) => activityPlannerController.createSchedule(req, res));
router.get('/schedules', (req, res) => activityPlannerController.getSchedules(req, res));

// ✅ Activity Instance Routes
router.post('/instances', (req, res) => activityPlannerController.createInstance(req, res));
router.get('/instances', (req, res) => activityPlannerController.getInstances(req, res));
router.put('/instances/:id', (req, res) => activityPlannerController.updateInstance(req, res));
router.delete('/instances/:id', (req, res) => activityPlannerController.deleteInstance(req, res));

// ✅ Activity Instance Operations
router.post('/instances/:id/start', (req, res) => activityPlannerController.startInstance(req, res));
router.post('/instances/:id/complete', (req, res) => activityPlannerController.completeInstance(req, res));

// ✅ Specialized Views
router.get('/instances/overdue', (req, res) => activityPlannerController.getOverdueInstances(req, res));
router.get('/instances/upcoming', (req, res) => activityPlannerController.getUpcomingInstances(req, res));

// ✅ Bulk Operations
router.post('/instances/bulk-update-status', (req, res) => activityPlannerController.bulkUpdateInstanceStatus(req, res));
router.post('/instances/bulk-assign', (req, res) => activityPlannerController.bulkAssignInstances(req, res));

console.log('✅ [ACTIVITY-PLANNER] Routes registered successfully at /api/activity-planner');

export default router;