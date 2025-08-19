// ✅ 1QA.MD COMPLIANCE: CONTROLLER - CLEAN ARCHITECTURE
// Infrastructure layer controller for advanced KB features

import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { DrizzleKnowledgeBaseRepository } from '../../infrastructure/repositories/DrizzleKnowledgeBaseRepository';
import { CreateTemplateUseCase } from '../use-cases/CreateTemplateUseCase';
import { CreateCommentUseCase } from '../use-cases/CreateCommentUseCase';
import { SchedulePublicationUseCase } from '../use-cases/SchedulePublicationUseCase';
import { CreateVersionUseCase } from '../use-cases/CreateVersionUseCase';

export class KnowledgeBaseAdvancedController {
  private repository: DrizzleKnowledgeBaseRepository;
  private createTemplateUseCase: CreateTemplateUseCase;
  private createCommentUseCase: CreateCommentUseCase;
  private schedulePublicationUseCase: SchedulePublicationUseCase;
  private createVersionUseCase: CreateVersionUseCase;

  constructor(private logger: Logger) {
    this.repository = new DrizzleKnowledgeBaseRepository();
    this.createTemplateUseCase = new CreateTemplateUseCase(this.repository, this.logger);
    this.createCommentUseCase = new CreateCommentUseCase(this.repository, this.logger);
    this.schedulePublicationUseCase = new SchedulePublicationUseCase(this.repository, this.logger);
    this.createVersionUseCase = new CreateVersionUseCase(this.repository, this.logger);
  }

  // ========================================
  // TEMPLATE ENDPOINTS - CLEAN ARCHITECTURE
  // ========================================

  async listTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.body;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'TenantId é obrigatório'
        });
        return;
      }

      const templates = await this.repository.listTemplates(tenantId);

      res.json({
        success: true,
        message: 'Templates listados com sucesso',
        data: templates
      });

    } catch (error: any) {
      this.logger.error('Error listing templates', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, user } = req.body;
      const { name, description, category, defaultTags, structure } = req.body;

      const request = {
        name,
        description,
        category,
        defaultTags: defaultTags || [],
        structure,
        tenantId,
        createdBy: user?.id || 'system'
      };

      const result = await this.createTemplateUseCase.execute(request);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);

    } catch (error: any) {
      this.logger.error('Error creating template', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ========================================
  // COMMENT ENDPOINTS - CLEAN ARCHITECTURE
  // ========================================

  async listComments(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.body;
      const { articleId } = req.params;

      if (!tenantId || !articleId) {
        res.status(400).json({
          success: false,
          message: 'TenantId e articleId são obrigatórios'
        });
        return;
      }

      const comments = await this.repository.findCommentsByArticle(articleId, tenantId);

      res.json({
        success: true,
        message: 'Comentários listados com sucesso',
        data: comments
      });

    } catch (error: any) {
      this.logger.error('Error listing comments', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async createComment(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, user } = req.body;
      const { articleId, content, rating } = req.body;

      const request = {
        articleId,
        content,
        rating,
        authorId: user?.id || 'system',
        authorName: user?.name || 'Sistema',
        tenantId
      };

      const result = await this.createCommentUseCase.execute(request);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);

    } catch (error: any) {
      this.logger.error('Error creating comment', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ========================================
  // PUBLICATION SCHEDULING - CLEAN ARCHITECTURE
  // ========================================

  async schedulePublication(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, user } = req.body;
      const { articleId, scheduledAt } = req.body;

      const request = {
        articleId,
        scheduledAt,
        tenantId,
        userId: user?.id || 'system'
      };

      const result = await this.schedulePublicationUseCase.execute(request);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error: any) {
      this.logger.error('Error scheduling publication', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ========================================
  // VERSION CONTROL - CLEAN ARCHITECTURE
  // ========================================

  async listVersions(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.body;
      const { articleId } = req.params;

      if (!tenantId || !articleId) {
        res.status(400).json({
          success: false,
          message: 'TenantId e articleId são obrigatórios'
        });
        return;
      }

      const versions = await this.repository.findVersionsByArticle(articleId, tenantId);

      res.json({
        success: true,
        message: 'Versões listadas com sucesso',
        data: versions
      });

    } catch (error: any) {
      this.logger.error('Error listing versions', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async createVersion(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, user } = req.body;
      const { articleId, title, changeDescription } = req.body;

      const request = {
        articleId,
        title,
        changeDescription,
        authorId: user?.id || 'system',
        authorName: user?.name || 'Sistema',
        tenantId
      };

      const result = await this.createVersionUseCase.execute(request);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);

    } catch (error: any) {
      this.logger.error('Error creating version', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ========================================
  // ROUTER REGISTRATION
  // ========================================

  getRouter(): Router {
    const router = Router();

    // Template routes
    router.get('/templates', this.listTemplates.bind(this));
    router.post('/templates', this.createTemplate.bind(this));

    // Comment routes
    router.get('/articles/:articleId/comments', this.listComments.bind(this));
    router.post('/comments', this.createComment.bind(this));

    // Publication scheduling
    router.post('/schedule-publication', this.schedulePublication.bind(this));

    // Version control routes
    router.get('/articles/:articleId/versions', this.listVersions.bind(this));
    router.post('/versions', this.createVersion.bind(this));

    return router;
  }
}