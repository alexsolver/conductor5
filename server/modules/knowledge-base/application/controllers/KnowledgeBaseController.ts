// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE CONTROLLER - CLEAN ARCHITECTURE
// Application layer controller - handles HTTP requests

import { Request, Response } from 'express';
import { CreateKnowledgeBaseUseCase } from '../use-cases/CreateKnowledgeBaseUseCase';
import { SearchKnowledgeBaseUseCase } from '../use-cases/SearchKnowledgeBaseUseCase';
import { CreateKnowledgeBaseArticleDTO, KnowledgeBaseSearchDTO } from '../dto/CreateKnowledgeBaseDTO';

export class KnowledgeBaseController {
  constructor(
    private createUseCase: CreateKnowledgeBaseUseCase,
    private searchUseCase: SearchKnowledgeBaseUseCase
  ) {}

  async createArticle(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Authentication required' });
        return;
      }

      const dto: CreateKnowledgeBaseArticleDTO = {
        ...req.body,
        authorId: userId,
        tenantId
      };

      const result = await this.createUseCase.execute(dto);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('❌ [KB-CONTROLLER] Create error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async searchArticles(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      const searchDto: KnowledgeBaseSearchDTO = {
        query: req.query.q as string || req.query.query as string,
        category: req.query.category as string,
        tags: Array.isArray(req.query.tags) ? req.query.tags : req.query.tags ? [req.query.tags as string] : undefined,
        status: req.query.status as any,
        visibility: req.query.visibility as any,
        authorId: req.query.authorId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any
      };

      const result = await this.searchUseCase.execute(searchDto, tenantId);
      res.json(result);
    } catch (error) {
      console.error('❌ [KB-CONTROLLER] Search error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getArticleById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID required' });
        return;
      }

      // This would use a GetByIdUseCase (not implemented yet for brevity)
      res.json({ success: true, message: 'Get by ID - to be implemented' });
    } catch (error) {
      console.error('❌ [KB-CONTROLLER] Get error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}