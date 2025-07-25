import { Router } from "express";
import { jwtAuth } from "../../middleware/jwtAuth";
import { KnowledgeBaseController } from "./application/controllers/KnowledgeBaseController";

const knowledgeBaseRouter = Router();
const knowledgeBaseController = new KnowledgeBaseController();

// Categories
knowledgeBaseRouter.get('/categories', jwtAuth, knowledgeBaseController.getCategories.bind(knowledgeBaseController));
knowledgeBaseRouter.post('/categories', jwtAuth, knowledgeBaseController.createCategory.bind(knowledgeBaseController));
knowledgeBaseRouter.put('/categories/:categoryId', jwtAuth, knowledgeBaseController.updateCategory.bind(knowledgeBaseController));
knowledgeBaseRouter.delete('/categories/:categoryId', jwtAuth, knowledgeBaseController.deleteCategory.bind(knowledgeBaseController));

// Articles
knowledgeBaseRouter.get('/articles', jwtAuth, knowledgeBaseController.getArticles.bind(knowledgeBaseController));
knowledgeBaseRouter.post('/articles', jwtAuth, knowledgeBaseController.createArticle.bind(knowledgeBaseController));
knowledgeBaseRouter.get('/articles/:articleId', jwtAuth, knowledgeBaseController.getArticleById.bind(knowledgeBaseController));
knowledgeBaseRouter.put('/articles/:articleId', jwtAuth, knowledgeBaseController.updateArticle.bind(knowledgeBaseController));
knowledgeBaseRouter.delete('/articles/:articleId', jwtAuth, knowledgeBaseController.deleteArticle.bind(knowledgeBaseController));

// Article Versions
knowledgeBaseRouter.get('/articles/:articleId/versions', jwtAuth, knowledgeBaseController.getArticleVersions.bind(knowledgeBaseController));

// Search
knowledgeBaseRouter.get('/search', jwtAuth, knowledgeBaseController.searchArticles.bind(knowledgeBaseController));

// Rating & Feedback
knowledgeBaseRouter.post('/articles/:articleId/rate', jwtAuth, knowledgeBaseController.rateArticle.bind(knowledgeBaseController));

// Comments
knowledgeBaseRouter.get('/articles/:articleId/comments', jwtAuth, knowledgeBaseController.getComments.bind(knowledgeBaseController));
knowledgeBaseRouter.post('/comments', jwtAuth, knowledgeBaseController.createComment.bind(knowledgeBaseController));

// Tags
knowledgeBaseRouter.get('/tags', jwtAuth, knowledgeBaseController.getTags.bind(knowledgeBaseController));
knowledgeBaseRouter.post('/tags', jwtAuth, knowledgeBaseController.createTag.bind(knowledgeBaseController));

// Analytics
knowledgeBaseRouter.get('/analytics', jwtAuth, knowledgeBaseController.getAnalytics.bind(knowledgeBaseController));
knowledgeBaseRouter.get('/analytics/advanced', jwtAuth, knowledgeBaseController.getAdvancedAnalytics.bind(knowledgeBaseController));

// Popular and Recent Articles
knowledgeBaseRouter.get('/articles/popular', jwtAuth, knowledgeBaseController.getPopularArticles.bind(knowledgeBaseController));
knowledgeBaseRouter.get('/articles/recent', jwtAuth, knowledgeBaseController.getRecentArticles.bind(knowledgeBaseController));

export { knowledgeBaseRouter };