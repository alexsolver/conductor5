/**
 * ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATES ROUTES
 * Clean Architecture - Presentation Layer
 * Definição de endpoints RESTful seguindo padrões rigorosos
 * 
 * @module TicketTemplateRoutes
 * @compliance 1qa.md - Clean Architecture
 * @created 2025-08-24 - Fixed controller execution
 */

import { Router, Request, Response } from 'express';
import { DrizzleTicketTemplateRepository } from './infrastructure/repositories/DrizzleTicketTemplateRepository';
import { TicketTemplateController } from './application/controllers/TicketTemplateController';

// ✅ 1QA.MD: Import Use Cases 
import { CreateTicketTemplateUseCase } from './application/use-cases/CreateTicketTemplateUseCase';
import { GetTicketTemplatesUseCase } from './application/use-cases/GetTicketTemplatesUseCase';
import { UpdateTicketTemplateUseCase } from './application/use-cases/UpdateTicketTemplateUseCase';

// ✅ 1QA.MD: Dependency injection setup - Clean Architecture
console.log('🔧 [TICKET-TEMPLATES-ROUTES] Initializing dependencies...');

const ticketTemplateRepository = new DrizzleTicketTemplateRepository();
console.log('✅ [TICKET-TEMPLATES-ROUTES] Repository created successfully');

// ✅ 1QA.MD: Proper Use Case injection matching Controller constructor
const createTicketTemplateUseCase = new CreateTicketTemplateUseCase(ticketTemplateRepository);
const getTicketTemplatesUseCase = new GetTicketTemplatesUseCase(ticketTemplateRepository);
const updateTicketTemplateUseCase = new UpdateTicketTemplateUseCase(ticketTemplateRepository);
console.log('✅ [TICKET-TEMPLATES-ROUTES] Use Cases created successfully');

// ✅ 1QA.MD: Controller instantiation with proper dependency injection
const ticketTemplateController = new TicketTemplateController(
  createTicketTemplateUseCase,
  getTicketTemplatesUseCase,
  updateTicketTemplateUseCase
);
console.log('✅ [TICKET-TEMPLATES-ROUTES] Controller created successfully');

// ✅ 1QA.MD: Router instance
const router = Router();
console.log('✅ [TICKET-TEMPLATES-ROUTES] Router initialized');

// ✅ 1QA.MD: Clean Architecture routes - Presentation Layer

// POST /api/ticket-templates - Criar template
router.post('/', async (req: Request, res: Response) => {
  console.log('🎯 [ROUTES] POST / called - Creating template');
  console.log('🎯 [ROUTES] Request body:', req.body);
  try {
    await ticketTemplateController.createTemplate(req as any, res);
  } catch (error) {
    console.error('❌ [ROUTES] Error in POST /', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    });
  }
});

// GET /api/ticket-templates - Listar templates
router.get('/', async (req, res) => {
  console.log('🎯 [ROUTES] GET / called - Getting templates');
  await ticketTemplateController.getTemplates(req, res);
});

// PUT /api/ticket-templates/:id - Atualizar template
router.put('/:id', async (req, res) => {
  console.log('🎯 [ROUTES] PUT /:id called - Updating template');
  await ticketTemplateController.updateTemplate(req as any, res);
});

// GET /api/ticket-templates/categories - Categorias disponíveis
router.get('/categories', async (req, res) => {
  console.log('🎯 [ROUTES] GET /categories called');
  await ticketTemplateController.getCategories(req as any, res);
});

// GET /api/ticket-templates/defaults - Templates padrão
router.get('/defaults', async (req, res) => {
  console.log('🎯 [ROUTES] GET /defaults called');
  await ticketTemplateController.getDefaultTemplates(req as any, res);
});

// GET /api/ticket-templates/popular - Templates populares
router.get('/popular', async (req, res) => {
  console.log('🎯 [ROUTES] GET /popular called');
  await ticketTemplateController.getPopularTemplates(req as any, res);
});

// GET /api/ticket-templates/:id/analytics - Analytics do template
router.get('/:id/analytics', async (req, res) => {
  console.log('🎯 [ROUTES] GET /:id/analytics called');
  await ticketTemplateController.getTemplateAnalytics(req as any, res);
});

// GET /api/ticket-templates/category/:category - Templates por categoria
router.get('/category/:category', async (req, res) => {
  console.log('🎯 [ROUTES] GET /category/:category called');
  await ticketTemplateController.getTemplatesByCategory(req as any, res);
});

// ✅ COMPATIBILITY ROUTES: Manter compatibilidade com frontend existente

// GET /api/ticket-templates/company/:companyId/stats - Estatísticas por empresa
router.get('/company/:companyId/stats', async (req, res) => {
  console.log('🎯 [ROUTES] GET /company/:companyId/stats called');
  await ticketTemplateController.getCompanyTemplateStats(req as any, res);
});

// GET /api/ticket-templates/company/:companyId - Templates por empresa
router.get('/company/:companyId', async (req, res) => {
  console.log('🎯 [ROUTES] GET /company/:companyId called');
  await ticketTemplateController.getTemplates(req, res);
});

console.log('✅ [TICKET-TEMPLATES-ROUTES] All routes registered successfully');

export default router;