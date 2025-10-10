// ✅ 1QA.MD COMPLIANCE: UPDATE KNOWLEDGE BASE ARTICLE USE CASE - CLEAN ARCHITECTURE
// Application layer - orchestrates domain logic for article updates

import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { KnowledgeBaseArticle } from '../../domain/entities/KnowledgeBase';
import { Logger } from 'winston';

export interface UpdateKnowledgeBaseArticleCommand {
  id: string;
  title?: string;
  content?: string;
  summary?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'pending_review' | 'published' | 'archived';
  visibility?: 'public' | 'internal' | 'restricted' | 'private';
  contentType?: 'rich_text' | 'markdown' | 'html';
}

export class UpdateKnowledgeBaseArticleUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(id: string, updates: Partial<UpdateKnowledgeBaseArticleCommand>, tenantId: string): Promise<KnowledgeBaseArticle | null> {
    try {
      this.logger.info(`[KB-UPDATE-USE-CASE] Updating knowledge base article: ${id} for tenant: ${tenantId}`);

      // Check if article exists
      const existingArticle = await this.repository.findById(id, tenantId);
      if (!existingArticle) {
        this.logger.error(`[KB-UPDATE-USE-CASE] Article not found: ${id}`);
        throw new Error('Article not found');
      }

      // Validate required fields if provided
      if (updates.title !== undefined && !updates.title?.trim()) {
        throw new Error('Article title cannot be empty');
      }
      
      if (updates.content !== undefined && !updates.content?.trim()) {
        throw new Error('Article content cannot be empty');
      }

      // Prepare updates object
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title.trim();
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.status !== undefined) updateData.status = updates.status;

      // Update article
      const updatedArticle = await this.repository.update(id, updateData, tenantId);

      if (!updatedArticle) {
        throw new Error('Failed to update article');
      }

      this.logger.info(`[KB-UPDATE-USE-CASE] Knowledge base article updated successfully: ${updatedArticle.id}`);
      return updatedArticle;

    } catch (error) {
      this.logger.error(`[KB-UPDATE-USE-CASE] Failed to update knowledge base article:`, error);
      throw error;
    }
  }
}