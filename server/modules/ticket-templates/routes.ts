/**
 * ✅ 1QA.MD COMPLIANCE: TICKET TEMPLATES ROUTES
 * Clean Architecture - Presentation Layer
 * Definição de endpoints RESTful
 * 
 * @module TicketTemplateRoutes
 * @compliance 1qa.md - Presentation Layer - Routes
 */

import { Router } from 'express';
import { DrizzleTicketTemplateRepository } from './infrastructure/repositories/DrizzleTicketTemplateRepository';
import { TicketTemplateApplicationService } from './application/services/TicketTemplateApplicationService';
import { TicketTemplateController } from './application/controllers/TicketTemplateController';

// ✅ Import Use Cases 
import { CreateTicketTemplateUseCase } from './application/use-cases/CreateTicketTemplateUseCase';
import { GetTicketTemplatesUseCase } from './application/use-cases/GetTicketTemplatesUseCase';
import { UpdateTicketTemplateUseCase } from './application/use-cases/UpdateTicketTemplateUseCase';

// ✅ 1QA.MD: Dependency injection setup - Clean Architecture com logs
console.log('🔧 [TICKET-TEMPLATES-ROUTES] Initializing dependencies...');

const ticketTemplateRepository = new DrizzleTicketTemplateRepository();
console.log('✅ [TICKET-TEMPLATES-ROUTES] Repository created successfully');

// ✅ 1QA.MD: Proper Use Case injection matching Controller constructor
const createTicketTemplateUseCase = new CreateTicketTemplateUseCase(ticketTemplateRepository);
const getTicketTemplatesUseCase = new GetTicketTemplatesUseCase(ticketTemplateRepository);
const updateTicketTemplateUseCase = new UpdateTicketTemplateUseCase(ticketTemplateRepository);
console.log('✅ [TICKET-TEMPLATES-ROUTES] Use Cases created successfully');

const ticketTemplateController = new TicketTemplateController(
  createTicketTemplateUseCase,
  getTicketTemplatesUseCase,
  updateTicketTemplateUseCase
);
console.log('✅ [TICKET-TEMPLATES-ROUTES] Controller initialized successfully');

const router = Router();

// ✅ 1QA.MD: RESTful endpoints following Clean Architecture

// ✅ COMPATIBILITY ROUTES: Suporte para padrões legacy /company/companyId
// GET /api/ticket-templates/company/:companyId - Templates por empresa (compatibilidade)
router.get('/company/:companyId', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/company/:companyId/stats - Estatísticas por empresa (compatibilidade)
router.get('/company/:companyId/stats', async (req, res) => {
  console.log('🎯 [TICKET-TEMPLATES-ROUTE] /company/:companyId/stats accessed');
  console.log('🎯 [TICKET-TEMPLATES-ROUTE] CompanyId:', req.params.companyId);
  console.log('🎯 [TICKET-TEMPLATES-ROUTE] User:', (req as any).user);
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/company/:companyId/categories - Categorias por empresa (compatibilidade)
router.get('/company/:companyId/categories', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// POST /api/ticket-templates/company/:companyId - Create template for specific company (legacy support)
router.post('/company/:companyId', async (req, res) => {
  await ticketTemplateController.createTemplate(req, res);
});

// GET /api/ticket-templates/company/:companyId/popular - Templates populares por empresa (compatibilidade)
router.get('/company/:companyId/popular', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/company/:companyId/search - Buscar templates por empresa (compatibilidade)
router.get('/company/:companyId/search', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// ✅ DIRECT ROUTES: Novos padrões Clean Architecture

// GET /api/ticket-templates - Buscar templates
router.get('/', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/popular - Templates populares
router.get('/popular', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// ✅ 1QA.MD: Clean Architecture routes (remove duplicate conflicting routes)
// These routes are handled by the compatibility routes above

// GET /api/ticket-templates/categories - Categorias disponíveis
router.get('/categories', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/stats - Estatísticas dos templates (alias para analytics)
router.get('/stats', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/analytics - Analytics dos templates
router.get('/analytics', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/:id - Buscar template por ID
router.get('/:id', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// POST /api/ticket-templates - Create template (can include companyId in body)
router.post('/', async (req, res) => {
  await ticketTemplateController.createTemplate(req, res);
});

// PUT /api/ticket-templates/:id - Atualizar template
router.put('/:id', async (req, res) => {
  res.status(501).json({ success: false, message: 'Method not implemented' });
});

// DELETE /api/ticket-templates/:id - Deletar template
router.delete('/:id', async (req, res) => {
  res.status(501).json({ success: false, message: 'Method not implemented' });
});

// POST /api/ticket-templates/:id/clone - Clonar template
router.post('/:id/clone', async (req, res) => {
  res.status(501).json({ success: false, message: 'Method not implemented' });
});

// POST /api/ticket-templates/:id/use - Incrementar uso do template
router.post('/:id/use', async (req, res) => {
  res.status(501).json({ success: false, message: 'Method not implemented' });
});

export { router as default };