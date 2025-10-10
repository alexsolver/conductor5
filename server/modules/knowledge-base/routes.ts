// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE ROUTES - CLEAN ARCHITECTURE
// Presentation layer - HTTP routes definition

import { Router } from 'express';
import { KnowledgeBaseController } from './application/controllers/KnowledgeBaseController';
import { KnowledgeBaseAdvancedController } from './application/controllers/KnowledgeBaseAdvancedController';
import { CreateKnowledgeBaseArticleUseCase } from './application/use-cases/CreateKnowledgeBaseArticleUseCase';
import { UpdateKnowledgeBaseArticleUseCase } from './application/use-cases/UpdateKnowledgeBaseArticleUseCase';
import { ApproveKnowledgeBaseArticleUseCase } from './application/use-cases/ApproveKnowledgeBaseArticleUseCase';
import { GetKnowledgeBaseDashboardUseCase } from './application/use-cases/GetKnowledgeBaseDashboardUseCase';
import { DrizzleKnowledgeBaseRepository } from './infrastructure/repositories/DrizzleKnowledgeBaseRepository';
import { TicketIntegrationService } from './infrastructure/integrations/TicketIntegrationService';
import { KnowledgeBaseDashboardWidget } from './infrastructure/widgets/KnowledgeBaseDashboardWidget';
import logger from '../../utils/logger';

const router = Router();

// Initialize repository and services
const repository = new DrizzleKnowledgeBaseRepository();
const dashboardWidget = new KnowledgeBaseDashboardWidget(repository, logger);
const ticketIntegration = new TicketIntegrationService(repository, logger);

// Initialize use cases
const createUseCase = new CreateKnowledgeBaseArticleUseCase(repository, logger);
const updateUseCase = new UpdateKnowledgeBaseArticleUseCase(repository, logger);
const approveUseCase = new ApproveKnowledgeBaseArticleUseCase(repository, logger);
const dashboardUseCase = new GetKnowledgeBaseDashboardUseCase(dashboardWidget, logger);

// Initialize controllers
const controller = new KnowledgeBaseController(
  createUseCase,
  updateUseCase,
  approveUseCase,
  dashboardUseCase,
  ticketIntegration,
  repository,
  logger
);

const advancedController = new KnowledgeBaseAdvancedController(
  repository,
  logger
);

// Article management routes
router.get('/articles', (req, res) => controller.searchArticles(req, res));
router.get('/articles/:id', (req, res) => controller.getArticle(req, res));
router.post('/articles', (req, res) => controller.createArticle(req, res));
router.put('/articles/:id', (req, res) => controller.updateArticle(req, res));
router.delete('/articles/:id', (req, res) => controller.deleteArticle(req, res));
router.post('/articles/:id/approve', (req, res) => controller.approveArticle(req, res));

// Dashboard and analytics routes
router.get('/dashboard', (req, res) => controller.getDashboard(req, res));

// Ticket integration routes
router.get('/ticket-suggestions', (req, res) => controller.getTicketSuggestions(req, res));
router.post('/articles/:articleId/link-ticket', (req, res) => controller.linkToTicket(req, res));

// ========================================
// ADVANCED FEATURES ROUTES
// ========================================

// Template management
router.post('/templates', (req, res) => advancedController.createTemplate(req, res));
router.get('/templates', (req, res) => advancedController.listTemplates(req, res));
router.get('/templates/:id', (req, res) => advancedController.getTemplate(req, res));

// Comments system
router.post('/articles/:articleId/comments', (req, res) => advancedController.createComment(req, res));
router.get('/articles/:articleId/comments', (req, res) => advancedController.getComments(req, res));

// Publication scheduling
router.post('/articles/:articleId/schedule', (req, res) => advancedController.schedulePublication(req, res));

// Version control
router.post('/articles/:articleId/versions', (req, res) => advancedController.createVersion(req, res));
router.get('/articles/:articleId/versions', (req, res) => advancedController.getVersions(req, res));

export { router as knowledgeBaseRoutes };