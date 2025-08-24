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

// ✅ 1QA.MD: Dependency injection setup
const ticketTemplateRepository = new DrizzleTicketTemplateRepository();
const ticketTemplateApplicationService = new TicketTemplateApplicationService(ticketTemplateRepository);
const ticketTemplateController = new TicketTemplateController(ticketTemplateApplicationService);

const router = Router();

// ✅ 1QA.MD: RESTful endpoints following Clean Architecture

// ✅ COMPATIBILITY ROUTES: Suporte para padrões legacy /company/companyId
// GET /api/ticket-templates/company/:companyId - Templates por empresa (compatibilidade)
router.get('/company/:companyId', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/company/:companyId/stats - Estatísticas por empresa (compatibilidade)
router.get('/company/:companyId/stats', async (req, res) => {
  await ticketTemplateController.getAnalytics(req, res);
});

// GET /api/ticket-templates/company/:companyId/categories - Categorias por empresa (compatibilidade)
router.get('/company/:companyId/categories', async (req, res) => {
  await ticketTemplateController.getCategories(req, res);
});

// POST /api/ticket-templates/company/:companyId - Create template for specific company (legacy support)
router.post('/company/:companyId', async (req, res) => {
  await ticketTemplateController.createTemplate(req, res);
});

// GET /api/ticket-templates/company/:companyId/popular - Templates populares por empresa (compatibilidade)
router.get('/company/:companyId/popular', async (req, res) => {
  await ticketTemplateController.getPopularTemplates(req, res);
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
  await ticketTemplateController.getPopularTemplates(req, res);
});

// GET /api/ticket-templates/company/:companyId/stats - Get company template statistics
router.get('/company/:companyId/stats', ticketTemplateController.getTemplateStatsByCompany.bind(ticketTemplateController));
// Get templates by company
router.get('/company/:companyId', ticketTemplateController.getTemplatesByCompany.bind(ticketTemplateController));

// GET /api/ticket-templates/categories - Categorias disponíveis
router.get('/categories', async (req, res) => {
  await ticketTemplateController.getCategories(req, res);
});

// GET /api/ticket-templates/stats - Estatísticas dos templates (alias para analytics)
router.get('/stats', async (req, res) => {
  await ticketTemplateController.getAnalytics(req, res);
});

// GET /api/ticket-templates/analytics - Analytics dos templates
router.get('/analytics', async (req, res) => {
  await ticketTemplateController.getAnalytics(req, res);
});

// GET /api/ticket-templates/:id - Buscar template por ID
router.get('/:id', async (req, res) => {
  await ticketTemplateController.getTemplateById(req, res);
});

// POST /api/ticket-templates - Create template (can include companyId in body)
router.post('/', async (req, res) => {
  await ticketTemplateController.createTemplate(req, res);
});

// PUT /api/ticket-templates/:id - Atualizar template
router.put('/:id', async (req, res) => {
  await ticketTemplateController.updateTemplate(req, res);
});

// DELETE /api/ticket-templates/:id - Deletar template
router.delete('/:id', async (req, res) => {
  await ticketTemplateController.deleteTemplate(req, res);
});

// POST /api/ticket-templates/:id/clone - Clonar template
router.post('/:id/clone', async (req, res) => {
  await ticketTemplateController.cloneTemplate(req, res);
});

// POST /api/ticket-templates/:id/use - Incrementar uso do template
router.post('/:id/use', async (req, res) => {
  await ticketTemplateController.useTemplate(req, res);
});

export { router as default };