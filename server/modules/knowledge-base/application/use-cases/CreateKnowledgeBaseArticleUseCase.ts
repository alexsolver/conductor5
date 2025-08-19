// ✅ 1QA.MD COMPLIANCE: CREATE KNOWLEDGE BASE ARTICLE USE CASE - CLEAN ARCHITECTURE
// Application layer - orchestrates domain logic for article creation

import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { KnowledgeBaseArticle } from '../../domain/entities/KnowledgeBase';
import { Logger } from 'winston';

export interface CreateKnowledgeBaseArticleCommand {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  authorId: string;
  contentType?: 'rich_text' | 'markdown' | 'html';
  visibility?: 'public' | 'internal' | 'restricted' | 'private';
  status?: 'draft' | 'pending_review' | 'published';
}

export class CreateKnowledgeBaseArticleUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(command: CreateKnowledgeBaseArticleCommand, tenantId: string): Promise<KnowledgeBaseArticle> {
    try {
      this.logger.info(`Creating knowledge base article: ${command.title} for tenant: ${tenantId}`);

      // Validate required fields
      if (!command.title?.trim()) {
        throw new Error('Article title is required');
      }

      if (!command.content?.trim()) {
        throw new Error('Article content is required');
      }

      if (!command.authorId) {
        throw new Error('Author ID is required');
      }

      // Create article entity
      const articleData: CreateKnowledgeBaseArticleData = {
        title: command.title.trim(),
        content: command.content,
        category: command.category,
        tags: command.tags || [],
        status: command.status || 'draft',
        visibility: command.visibility || 'internal',
        authorId: command.authorId,
        contentType: command.contentType || 'rich_text'
      };

      // Save article
      const article = await this.repository.create(articleData, tenantId);

      this.logger.info(`Knowledge base article created successfully: ${article.id}`);
      return article;

    } catch (error) {
      this.logger.error(`Failed to create knowledge base article: ${error}`);
      throw error;
    }
  }
}