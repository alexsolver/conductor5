import { Router } from 'express';
import { KnowledgeBaseController } from './controllers/KnowledgeBaseController';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const controller = new KnowledgeBaseController();

// Aplicar autenticação JWT a todas as rotas
router.use(jwtAuth);

// ROTAS DE CATEGORIAS
router.get('/categories', controller.getAllCategories.bind(controller));
router.post('/categories', controller.createCategory.bind(controller));
router.put('/categories/:id', controller.updateCategory.bind(controller));
router.delete('/categories/:id', controller.deleteCategory.bind(controller));

// ROTAS DE ARTIGOS
router.get('/articles', controller.getAllArticles.bind(controller));
router.get('/articles/:id', controller.getArticleById.bind(controller));
router.post('/articles', controller.createArticle.bind(controller));
router.put('/articles/:id', controller.updateArticle.bind(controller));
router.delete('/articles/:id', controller.deleteArticle.bind(controller));

// ROTAS DE COMENTÁRIOS
router.get('/articles/:articleId/comments', controller.getArticleComments.bind(controller));
router.post('/articles/:articleId/comments', controller.createComment.bind(controller));
router.put('/comments/:id', controller.updateComment.bind(controller));
router.delete('/comments/:id', controller.deleteComment.bind(controller));

// ROTAS DE AVALIAÇÕES
router.get('/articles/:articleId/ratings', controller.getArticleRatings.bind(controller));
router.post('/articles/:articleId/ratings', controller.createRating.bind(controller));

// ROTAS DE TEMPLATES
router.get('/templates', controller.getAllTemplates.bind(controller));
router.post('/templates', controller.createTemplate.bind(controller));
router.put('/templates/:id', controller.updateTemplate.bind(controller));
router.delete('/templates/:id', controller.deleteTemplate.bind(controller));

// ROTAS DE ANALYTICS
router.get('/analytics', controller.getAnalytics.bind(controller));

// ROTAS DE BUSCA
router.get('/search', controller.searchArticles.bind(controller));

// ROTAS DE CONFIGURAÇÕES
router.get('/settings', controller.getSettings.bind(controller));
router.put('/settings', controller.updateSettings.bind(controller));

export default router;