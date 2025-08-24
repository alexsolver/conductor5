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

// GET /api/ticket-templates - Buscar templates
router.get('/', async (req, res) => {
  await ticketTemplateController.getTemplates(req, res);
});

// GET /api/ticket-templates/popular - Templates populares
router.get('/popular', async (req, res) => {
  await ticketTemplateController.getPopularTemplates(req, res);
});

// GET /api/ticket-templates/categories - Categorias disponíveis
router.get('/categories', async (req, res) => {
  await ticketTemplateController.getCategories(req, res);
});

// GET /api/ticket-templates/analytics - Analytics dos templates
router.get('/analytics', async (req, res) => {
  await ticketTemplateController.getAnalytics(req, res);
});

// GET /api/ticket-templates/:id - Buscar template por ID
router.get('/:id', async (req, res) => {
  await ticketTemplateController.getTemplateById(req, res);
});

// POST /api/ticket-templates - Criar template
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

export default router;