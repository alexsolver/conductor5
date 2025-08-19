// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE CONTROLLER - CLEAN ARCHITECTURE
// Application layer - handles HTTP requests and responses

import { Request, Response } from 'express';
import { CreateKnowledgeBaseArticleUseCase } from '../use-cases/CreateKnowledgeBaseArticleUseCase';
import { UpdateKnowledgeBaseArticleUseCase } from '../use-cases/UpdateKnowledgeBaseArticleUseCase';
import { ApproveKnowledgeBaseArticleUseCase } from '../use-cases/ApproveKnowledgeBaseArticleUseCase';
import { GetKnowledgeBaseDashboardUseCase } from '../use-cases/GetKnowledgeBaseDashboardUseCase';
import { TicketIntegrationService } from '../../infrastructure/integrations/TicketIntegrationService';
import { Logger } from 'winston';

export class KnowledgeBaseController {
  constructor(
    private createUseCase: CreateKnowledgeBaseArticleUseCase,
    private updateUseCase: UpdateKnowledgeBaseArticleUseCase,
    private approveUseCase: ApproveKnowledgeBaseArticleUseCase,
    private dashboardUseCase: GetKnowledgeBaseDashboardUseCase,
    private ticketIntegration: TicketIntegrationService,
    private logger: Logger
  ) {}

  async createArticle(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const command = {
        ...req.body,
        authorId: req.user?.id || req.body.authorId
      };

      const article = await this.createUseCase.execute(command, tenantId);
      
      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        data: article
      });

    } catch (error) {
      this.logger.error(`Create article error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to create article',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateArticle(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const articleId = req.params.id;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const command = {
        id: articleId,
        ...req.body
      };

      const article = await this.updateUseCase.execute(command, tenantId);
      
      res.json({
        success: true,
        message: 'Article updated successfully',
        data: article
      });

    } catch (error) {
      this.logger.error(`Update article error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to update article',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async approveArticle(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const articleId = req.params.id;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const command = {
        articleId,
        reviewerId: req.user?.id || '',
        ...req.body
      };

      const article = await this.approveUseCase.execute(command, tenantId);
      
      res.json({
        success: true,
        message: 'Article approval processed successfully',
        data: article
      });

    } catch (error) {
      this.logger.error(`Approve article error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to process article approval',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const dashboardData = await this.dashboardUseCase.execute(tenantId);
      
      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData
      });

    } catch (error) {
      this.logger.error(`Get dashboard error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTicketSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { ticketId, category, description } = req.query;
      
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const suggestions = await this.ticketIntegration.getSuggestedArticlesForTicket(
        ticketId as string,
        category as string,
        description as string,
        tenantId
      );
      
      res.json({
        success: true,
        message: 'Ticket suggestions retrieved successfully',
        data: suggestions
      });

    } catch (error) {
      this.logger.error(`Get ticket suggestions error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get ticket suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async linkToTicket(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { articleId } = req.params;
      const { ticketId } = req.body;
      
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const success = await this.ticketIntegration.linkArticleToTicket(ticketId, articleId, tenantId);
      
      res.json({
        success,
        message: success ? 'Article linked to ticket successfully' : 'Failed to link article to ticket'
      });

    } catch (error) {
      this.logger.error(`Link to ticket error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to link article to ticket',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}