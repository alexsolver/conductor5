// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE ROUTES - CLEAN ARCHITECTURE
// Presentation layer - HTTP endpoints

import { Router } from 'express';
import { KnowledgeBaseApplicationService } from './application/services/KnowledgeBaseApplicationService';

export function createKnowledgeBaseRoutes(): Router {
  const router = Router();
  const applicationService = new KnowledgeBaseApplicationService();
  const controller = applicationService.getController();

  // Article management endpoints
  router.post('/articles', async (req, res) => {
    await controller.createArticle(req, res);
  });

  router.get('/articles', async (req, res) => {
    await controller.searchArticles(req, res);
  });

  router.get('/articles/:id', async (req, res) => {
    await controller.getArticleById(req, res);
  });

  return router;
}

// Export for integration with main routes
export default createKnowledgeBaseRoutes;