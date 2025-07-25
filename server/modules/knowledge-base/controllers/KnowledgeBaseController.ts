import { Request, Response } from 'express';
import { KnowledgeBaseRepository } from '../repositories/KnowledgeBaseRepository';

const repository = new KnowledgeBaseRepository();

export class KnowledgeBaseController {
  // CATEGORIAS
  async getAllCategories(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const categories = await repository.getAllCategories(tenantId);
      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const categoryData = {
        ...req.body,
        tenantId,
        createdBy: userId,
        updatedBy: userId
      };
      
      const category = await repository.createCategory(categoryData);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId, id: userId } = req.user!;
      
      const category = await repository.updateCategory(id, tenantId, {
        ...req.body,
        updatedBy: userId
      });
      
      res.json({ success: true, data: category });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user!;
      
      await repository.deleteCategory(id, tenantId);
      res.json({ success: true, message: 'Categoria removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ARTIGOS
  async getAllArticles(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const {
        categoryId,
        status,
        type,
        search,
        page = '1',
        limit = '20'
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const articles = await repository.getAllArticles(tenantId, {
        categoryId: categoryId as string,
        status: status as string,
        type: type as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset
      });
      
      res.json({ success: true, data: articles });
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getArticleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user!;
      
      const article = await repository.getArticleById(id, tenantId);
      if (!article) {
        return res.status(404).json({ error: 'Artigo não encontrado' });
      }
      
      // Incrementar contador de visualizações
      await repository.incrementViewCount(id, tenantId);
      
      res.json({ success: true, data: article });
    } catch (error) {
      console.error('Erro ao buscar artigo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createArticle(req: Request, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      
      // Gerar slug automaticamente a partir do título
      const slug = req.body.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      const articleData = {
        ...req.body,
        slug,
        tenantId,
        createdBy: userId,
        updatedBy: userId
      };
      
      const article = await repository.createArticle(articleData);
      res.status(201).json({ success: true, data: article });
    } catch (error) {
      console.error('Erro ao criar artigo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId, id: userId } = req.user!;
      
      const article = await repository.updateArticle(id, tenantId, {
        ...req.body,
        updatedBy: userId
      });
      
      res.json({ success: true, data: article });
    } catch (error) {
      console.error('Erro ao atualizar artigo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user!;
      
      await repository.deleteArticle(id, tenantId);
      res.json({ success: true, message: 'Artigo removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover artigo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // COMENTÁRIOS
  async getArticleComments(req: Request, res: Response) {
    try {
      const { articleId } = req.params;
      const { tenantId } = req.user!;
      
      const comments = await repository.getArticleComments(articleId, tenantId);
      res.json({ success: true, data: comments });
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createComment(req: Request, res: Response) {
    try {
      const { articleId } = req.params;
      const { tenantId, id: userId } = req.user!;
      
      const commentData = {
        ...req.body,
        articleId,
        tenantId,
        createdBy: userId,
        updatedBy: userId
      };
      
      const comment = await repository.createComment(commentData);
      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId, id: userId } = req.user!;
      
      const comment = await repository.updateComment(id, tenantId, {
        ...req.body,
        updatedBy: userId
      });
      
      res.json({ success: true, data: comment });
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user!;
      
      await repository.deleteComment(id, tenantId);
      res.json({ success: true, message: 'Comentário removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover comentário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // AVALIAÇÕES
  async getArticleRatings(req: Request, res: Response) {
    try {
      const { articleId } = req.params;
      const { tenantId } = req.user!;
      
      const ratings = await repository.getArticleRatings(articleId, tenantId);
      res.json({ success: true, data: ratings });
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createRating(req: Request, res: Response) {
    try {
      const { articleId } = req.params;
      const { tenantId, id: userId } = req.user!;
      
      const ratingData = {
        ...req.body,
        articleId,
        userId,
        tenantId
      };
      
      const rating = await repository.createRating(ratingData);
      
      // Atualizar média de avaliações do artigo
      await repository.updateArticleRatingAverage(articleId, tenantId);
      
      res.status(201).json({ success: true, data: rating });
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // TEMPLATES
  async getAllTemplates(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { type } = req.query;
      
      const templates = await repository.getAllTemplates(tenantId, type as string);
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createTemplate(req: Request, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      
      const templateData = {
        ...req.body,
        tenantId,
        createdBy: userId,
        updatedBy: userId
      };
      
      const template = await repository.createTemplate(templateData);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      console.error('Erro ao criar template:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId, id: userId } = req.user!;
      
      const template = await repository.updateTemplate(id, tenantId, {
        ...req.body,
        updatedBy: userId
      });
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user!;
      
      await repository.deleteTemplate(id, tenantId);
      res.json({ success: true, message: 'Template removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover template:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ANALYTICS
  async getAnalytics(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const analytics = await repository.getAnalyticsOverview(tenantId);
      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // BUSCA
  async searchArticles(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { q: query, categoryId, type, limit = '10' } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Parâmetro de busca obrigatório' });
      }
      
      const results = await repository.searchArticles(tenantId, query as string, {
        categoryId: categoryId as string,
        type: type as string,
        limit: parseInt(limit as string)
      });
      
      res.json({ success: true, data: results });
    } catch (error) {
      console.error('Erro na busca:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // CONFIGURAÇÕES
  async getSettings(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const settings = await repository.getSettings(tenantId);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const settings = await repository.updateSettings(tenantId, req.body, userId);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}