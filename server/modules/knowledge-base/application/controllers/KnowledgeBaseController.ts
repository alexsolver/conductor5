
// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE CONTROLLER - CLEAN ARCHITECTURE
// Application layer controller - HTTP request handling

import { Request, Response } from 'express';
import { CreateKnowledgeBaseArticleUseCase } from '../use-cases/CreateKnowledgeBaseArticleUseCase';
import { UpdateKnowledgeBaseArticleUseCase } from '../use-cases/UpdateKnowledgeBaseArticleUseCase';
import { ApproveKnowledgeBaseArticleUseCase } from '../use-cases/ApproveKnowledgeBaseArticleUseCase';
import { GetKnowledgeBaseDashboardUseCase } from '../use-cases/GetKnowledgeBaseDashboardUseCase';
import { TicketIntegrationService } from '../../infrastructure/integrations/TicketIntegrationService';
import { DrizzleKnowledgeBaseRepository } from '../../infrastructure/repositories/DrizzleKnowledgeBaseRepository';
import { CreateVersionUseCase } from '../use-cases/CreateVersionUseCase';
import { ManageArticleTemplatesUseCase } from '../use-cases/ManageArticleTemplatesUseCase';
import { ManageCommentsAndRatingsUseCase } from '../use-cases/ManageCommentsAndRatingsUseCase';
import { SchedulePublicationUseCase } from '../use-cases/SchedulePublicationUseCase';
import logger from '../../../utils/logger';

export class KnowledgeBaseController {
  constructor(
    private createUseCase: CreateKnowledgeBaseArticleUseCase,
    private updateUseCase: UpdateKnowledgeBaseArticleUseCase,
    private approveUseCase: ApproveKnowledgeBaseArticleUseCase,
    private dashboardUseCase: GetKnowledgeBaseDashboardUseCase,
    private ticketIntegration: TicketIntegrationService,
    private repository: DrizzleKnowledgeBaseRepository,
    private logger: typeof logger
  ) {}

  async createArticle(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.id;
      
      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Autenticação obrigatória' });
        return;
      }

      const articleData = {
        ...req.body,
        authorId: userId,
        tenantId
      };

      const result = await this.createUseCase.execute(articleData);
      res.status(201).json(result);
    } catch (error) {
      this.logger.error('Error creating article:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async updateArticle(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.id;
      const { id } = req.params;
      
      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Autenticação obrigatória' });
        return;
      }

      const result = await this.updateUseCase.execute(id, req.body, tenantId);
      res.json(result);
    } catch (error) {
      this.logger.error('Error updating article:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async approveArticle(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.id;
      const { id } = req.params;
      
      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Autenticação obrigatória' });
        return;
      }

      const result = await this.approveUseCase.execute(id, userId, tenantId);
      res.json(result);
    } catch (error) {
      this.logger.error('Error approving article:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async searchArticles(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID obrigatório' });
        return;
      }

      const searchParams = {
        ...req.query,
        tenantId
      };

      const articles = await this.repository.search(searchParams as any);
      
      res.json({
        success: true,
        message: 'Articles retrieved successfully',
        data: {
          articles,
          total: articles.length,
          hasMore: false
        }
      });
    } catch (error) {
      this.logger.error('Error searching articles:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID obrigatório' });
        return;
      }

      const result = await this.dashboardUseCase.execute(tenantId);
      res.json(result);
    } catch (error) {
      this.logger.error('Error getting dashboard:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async getTicketSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const { ticketId } = req.query;
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID obrigatório' });
        return;
      }

      const suggestions = await this.ticketIntegration.getArticleSuggestions(ticketId as string, tenantId);
      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      this.logger.error('Error getting ticket suggestions:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async linkToTicket(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const { articleId } = req.params;
      const { ticketId } = req.body;
      
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID obrigatório' });
        return;
      }

      const result = await this.ticketIntegration.linkArticleToTicket(articleId, ticketId, tenantId);
      res.json(result);
    } catch (error) {
      this.logger.error('Error linking to ticket:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // New advanced features

  async createVersion(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.id;
      const { articleId } = req.params;
      
      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Autenticação obrigatória' });
        return;
      }

      const versionUseCase = new CreateVersionUseCase(this.repository, this.logger);
      const result = await versionUseCase.execute(articleId, req.body, userId, tenantId);
      res.json(result);
    } catch (error) {
      this.logger.error('Error creating version:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async manageTemplates(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.id;
      
      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Autenticação obrigatória' });
        return;
      }

      const templatesUseCase = new ManageArticleTemplatesUseCase(this.repository, this.logger);
      const result = await templatesUseCase.execute(req.body, userId, tenantId);
      res.json(result);
    } catch (error) {
      this.logger.error('Error managing templates:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async manageComments(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.id;
      const { articleId } = req.params;
      
      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Autenticação obrigatória' });
        return;
      }

      const commentsUseCase = new ManageCommentsAndRatingsUseCase(this.repository, this.logger);
      const result = await commentsUseCase.execute(articleId, req.body, userId, tenantId);
      res.json(result);
    } catch (error) {
      this.logger.error('Error managing comments:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async schedulePublication(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.id;
      const { articleId } = req.params;
      
      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Autenticação obrigatória' });
        return;
      }

      const scheduleUseCase = new SchedulePublicationUseCase(this.repository, this.logger);
      const result = await scheduleUseCase.execute(articleId, req.body, userId, tenantId);
      res.json(result);
    } catch (error) {
      this.logger.error('Error scheduling publication:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}
