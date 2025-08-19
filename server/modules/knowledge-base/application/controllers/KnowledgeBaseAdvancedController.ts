// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Controller para funcionalidades avançadas seguindo padrões Domain-Driven Design

import { Request, Response } from 'express';
import { Logger } from 'winston';
import { CreateTemplateUseCase } from '../use-cases/CreateTemplateUseCase';
import { CreateCommentUseCase } from '../use-cases/CreateCommentUseCase';
import { SchedulePublicationUseCase } from '../use-cases/SchedulePublicationUseCase';
import { CreateVersionUseCase } from '../use-cases/CreateVersionUseCase';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export class KnowledgeBaseAdvancedController {
  constructor(
    private knowledgeBaseRepository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  // ========================================
  // TEMPLATE ENDPOINTS
  // ========================================

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!tenantId || !userId) {
        res.status(400).json({ 
          success: false, 
          message: 'Tenant ID and User ID are required' 
        });
        return;
      }

      const useCase = new CreateTemplateUseCase(this.knowledgeBaseRepository, this.logger);
      const result = await useCase.execute({
        ...req.body,
        tenantId,
        createdBy: userId
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error(`❌ [KB-ADVANCED-CONTROLLER] Template creation error`, { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async listTemplates(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ 
          success: false, 
          message: 'Tenant ID is required' 
        });
        return;
      }

      const templates = await this.knowledgeBaseRepository.listTemplates(tenantId);
      
      res.json({
        success: true,
        data: templates,
        message: 'Templates retrieved successfully'
      });
    } catch (error: any) {
      this.logger.error(`❌ [KB-ADVANCED-CONTROLLER] Template listing error`, { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      if (!tenantId) {
        res.status(400).json({ 
          success: false, 
          message: 'Tenant ID is required' 
        });
        return;
      }

      const template = await this.knowledgeBaseRepository.findTemplateById(id, tenantId);
      
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found'
        });
        return;
      }

      res.json({
        success: true,
        data: template,
        message: 'Template retrieved successfully'
      });
    } catch (error: any) {
      this.logger.error(`❌ [KB-ADVANCED-CONTROLLER] Template retrieval error`, { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  // ========================================
  // COMMENT ENDPOINTS
  // ========================================

  async createComment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const userName = req.headers['x-user-name'] as string || 'Anonymous';

      if (!tenantId || !userId) {
        res.status(400).json({ 
          success: false, 
          message: 'Tenant ID and User ID are required' 
        });
        return;
      }

      const useCase = new CreateCommentUseCase(this.knowledgeBaseRepository, this.logger);
      const result = await useCase.execute({
        ...req.body,
        authorId: userId,
        authorName: userName,
        tenantId
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error(`❌ [KB-ADVANCED-CONTROLLER] Comment creation error`, { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async getComments(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { articleId } = req.params;

      if (!tenantId) {
        res.status(400).json({ 
          success: false, 
          message: 'Tenant ID is required' 
        });
        return;
      }

      const comments = await this.knowledgeBaseRepository.findCommentsByArticle(articleId, tenantId);
      
      res.json({
        success: true,
        data: comments,
        message: 'Comments retrieved successfully'
      });
    } catch (error: any) {
      this.logger.error(`❌ [KB-ADVANCED-CONTROLLER] Comments retrieval error`, { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  // ========================================
  // SCHEDULING ENDPOINTS
  // ========================================

  async schedulePublication(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!tenantId || !userId) {
        res.status(400).json({ 
          success: false, 
          message: 'Tenant ID and User ID are required' 
        });
        return;
      }

      const useCase = new SchedulePublicationUseCase(this.knowledgeBaseRepository, this.logger);
      const result = await useCase.execute({
        ...req.body,
        scheduledFor: new Date(req.body.scheduledFor),
        scheduledBy: userId,
        tenantId
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error(`❌ [KB-ADVANCED-CONTROLLER] Publication scheduling error`, { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  // ========================================
  // VERSION ENDPOINTS
  // ========================================

  async createVersion(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!tenantId || !userId) {
        res.status(400).json({ 
          success: false, 
          message: 'Tenant ID and User ID are required' 
        });
        return;
      }

      const useCase = new CreateVersionUseCase(this.knowledgeBaseRepository, this.logger);
      const result = await useCase.execute({
        ...req.body,
        createdBy: userId,
        tenantId
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error(`❌ [KB-ADVANCED-CONTROLLER] Version creation error`, { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async getVersions(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { articleId } = req.params;

      if (!tenantId) {
        res.status(400).json({ 
          success: false, 
          message: 'Tenant ID is required' 
        });
        return;
      }

      const versions = await this.knowledgeBaseRepository.findVersionsByArticle(articleId, tenantId);
      
      res.json({
        success: true,
        data: versions,
        message: 'Versions retrieved successfully'
      });
    } catch (error: any) {
      this.logger.error(`❌ [KB-ADVANCED-CONTROLLER] Versions retrieval error`, { 
        error: error.message 
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
}