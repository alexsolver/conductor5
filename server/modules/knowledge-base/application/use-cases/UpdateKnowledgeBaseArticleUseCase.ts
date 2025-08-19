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

  async execute(command: UpdateKnowledgeBaseArticleCommand, tenantId: string): Promise<KnowledgeBaseArticle> {
    try {
      this.logger.info(`Updating knowledge base article: ${command.id} for tenant: ${tenantId}`);

      // Check if article exists
      const existingArticle = await this.repository.findById(command.id, tenantId);
      if (!existingArticle) {
        throw new Error('Article not found');
      }

      // Validate required fields if provided
      if (command.title !== undefined && !command.title?.trim()) {
        throw new Error('Article title cannot be empty');
      }
      
      if (command.content !== undefined && !command.content?.trim()) {
        throw new Error('Article content cannot be empty');
      }

      // Prepare updates
      const updates: Partial<KnowledgeBaseArticle> = {};
      
      if (command.title !== undefined) updates.title = command.title.trim();
      if (command.content !== undefined) updates.content = command.content;
      if (command.summary !== undefined) updates.summary = command.summary?.trim();
      if (command.category !== undefined) updates.category = command.category;
      if (command.tags !== undefined) updates.tags = command.tags;
      if (command.status !== undefined) updates.status = command.status;
      if (command.visibility !== undefined) updates.visibility = command.visibility;
      if (command.contentType !== undefined) updates.contentType = command.contentType;

      // Increment version for significant changes
      if (command.content !== undefined || command.title !== undefined) {
        updates.version = existingArticle.version + 1;
      }

      // Update article
      const updatedArticle = await this.repository.update(command.id, updates, tenantId);

      this.logger.info(`Knowledge base article updated successfully: ${updatedArticle.id}`);
      return updatedArticle;

    } catch (error) {
      this.logger.error(`Failed to update knowledge base article: ${error}`);
      throw error;
    }
  }
}