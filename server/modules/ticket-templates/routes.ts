/**
 * ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATES ROUTES
 * Clean Architecture - Presentation Layer
 * Definição de endpoints RESTful
 * 
 * @module TicketTemplateRoutes
 * @compliance 1qa.md - Presentation Layer - Routes
 */

import { Router } from 'express';
import { TicketTemplateController } from './application/controllers/TicketTemplateController';
import { GetTicketTemplatesUseCase } from './application/use-cases/GetTicketTemplatesUseCase';
import { CreateTicketTemplateUseCase } from './application/use-cases/CreateTicketTemplateUseCase';
import { UpdateTicketTemplateUseCase } from './application/use-cases/UpdateTicketTemplateUseCase';
import { SimplifiedTicketTemplateRepository } from './infrastructure/repositories/SimplifiedTicketTemplateRepository';

const router = Router();

// ✅ 1QA.MD: Dependency injection following Clean Architecture
const repository = new SimplifiedTicketTemplateRepository();
const getTemplatesUseCase = new GetTicketTemplatesUseCase(repository);
const createTemplateUseCase = new CreateTicketTemplateUseCase(repository);
const updateTemplateUseCase = new UpdateTicketTemplateUseCase(repository);

const controller = new TicketTemplateController(
  createTemplateUseCase,
  getTemplatesUseCase,
  updateTemplateUseCase
);

// ========================================
// TICKET TEMPLATE ROUTES - ORDEM ESPECÍFICA
// ========================================

// 🚨 CRITICAL: Most specific routes first to prevent conflicts
// GET /ticket-templates/categories - Get template categories
router.get('/categories', (req, res) => {
  console.log('🚀 [ROUTES] /categories endpoint called');
  return controller.getCategories(req, res);
});

// GET /ticket-templates/defaults - Get default templates
router.get('/defaults', (req, res) => {
  console.log('🚀 [ROUTES] /defaults endpoint called');
  return controller.getDefaultTemplates(req, res);
});

// GET /ticket-templates/popular - Get popular templates
router.get('/popular', (req, res) => {
  console.log('🚀 [ROUTES] /popular endpoint called');
  return controller.getPopularTemplates(req, res);
});

// GET /ticket-templates/company/:companyId/stats - Get company template stats
router.get('/company/:companyId/stats', (req, res) => {
  console.log('🚀 [ROUTES] /company/:companyId/stats endpoint called');
  return controller.getCompanyTemplateStats(req, res);
});

// GET /ticket-templates/category/:category - Get templates by category
router.get('/category/:category', (req, res) => {
  console.log('🚀 [ROUTES] /category/:category endpoint called');
  return controller.getTemplatesByCategory(req, res);
});

// GET /ticket-templates/:id/analytics - Get template analytics (before generic :id)
router.get('/:id/analytics', (req, res) => {
  console.log('🚀 [ROUTES] /:id/analytics endpoint called');
  return controller.getTemplateAnalytics(req, res);
});

// GET /ticket-templates - Get all templates with filters
router.get('/', (req, res) => {
  console.log('🚀 [ROUTES] / (root) endpoint called');
  console.log('🚀 [ROUTES] Query params:', req.query);
  return controller.getTemplates(req, res);
});

// GET /ticket-templates/:id - Get specific template (most generic last)
router.get('/:id', (req, res) => {
  console.log('🚀 [ROUTES] /:id endpoint called for ID:', req.params.id);
  return controller.getTemplates(req, res);
});

// POST /ticket-templates/company/:companyId - Create company template
router.post('/company/:companyId', (req, res) => {
  console.log('🚀 [ROUTES] POST /company/:companyId endpoint called');
  return controller.createTemplate(req, res);
});

// POST /ticket-templates - Create template
router.post('/', (req, res) => {
  console.log('🚀 [ROUTES] POST / endpoint called');
  return controller.createTemplate(req, res);
});

// PUT /ticket-templates/:id - Update template
router.put('/:id', (req, res) => {
  console.log('🚀 [ROUTES] PUT /:id endpoint called');
  return controller.updateTemplate(req, res);
});

export default router;