// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER
// Use Case para criação de comentários seguindo padrões Domain-Driven Design

import { IKnowledgeBaseRepository } from "../../domain/repositories/IKnowledgeBaseRepository";
import { Logger } from "winston";
import { InsertKnowledgeBaseComment } from "@shared/schema-knowledge-base";

export interface CreateCommentRequest {
  articleId: string;
  content: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  tenantId: string;
}

export interface CreateCommentResponse {
  success: boolean;
  comment?: any;
  message: string;
}

export class CreateCommentUseCase {
  constructor(
    private knowledgeBaseRepository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(request: CreateCommentRequest): Promise<CreateCommentResponse> {
    try {
      this.logger.info(`💬 [CREATE-COMMENT-UC] Creating comment for article: ${request.articleId}`, {
        tenantId: request.tenantId,
        authorId: request.authorId,
        parentId: request.parentId
      });

      // Domain validation
      if (!request.content?.trim()) {
        throw new Error('Comment content is required');
      }

      if (!request.articleId) {
        throw new Error('Article ID is required');
      }

      if (!request.authorId) {
        throw new Error('Author ID is required');
      }

      // Verify article exists
      const article = await this.knowledgeBaseRepository.findById(
        request.articleId,
        request.tenantId
      );

      if (!article) {
        throw new Error('Article not found');
      }

      // If parent comment specified, verify it exists
      if (request.parentId) {
        const parentComment = await this.knowledgeBaseRepository.findCommentById(
          request.parentId,
          request.tenantId
        );

        if (!parentComment) {
          throw new Error('Parent comment not found');
        }
      }

      const commentData = {
        articleId: request.articleId,
        content: request.content.trim(),
        parentId: request.parentId || null,
        authorId: request.authorId,
        authorName: request.authorName,
        tenantId: request.tenantId,
        isApproved: true // Auto-approve for now
      };

      const comment = await this.knowledgeBaseRepository.createComment(commentData);

      this.logger.info(`✅ [CREATE-COMMENT-UC] Comment created successfully`, {
        commentId: comment.id,
        articleId: request.articleId,
        authorId: request.authorId,
        tenantId: request.tenantId
      });

      return {
        success: true,
        comment,
        message: 'Comment created successfully'
      };

    } catch (error: any) {
      this.logger.error(`❌ [CREATE-COMMENT-UC] Failed to create comment`, {
        error: error.message,
        tenantId: request.tenantId,
        articleId: request.articleId,
        authorId: request.authorId
      });

      return {
        success: false,
        message: error.message || 'Failed to create comment'
      };
    }
  }
}