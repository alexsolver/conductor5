// ✅ 1QA.MD COMPLIANCE: USE CASE - CLEAN ARCHITECTURE
// Application layer use case for comment creation

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export interface CreateCommentRequest {
  articleId: string;
  content: string;
  rating?: number;
  authorId: string;
  authorName: string;
  tenantId: string;
}

export interface CreateCommentResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class CreateCommentUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(request: CreateCommentRequest): Promise<CreateCommentResponse> {
    try {
      this.logger.info('Creating comment', { 
        articleId: request.articleId,
        tenantId: request.tenantId 
      });

      // Validate required fields
      if (!request.articleId || !request.content || !request.tenantId) {
        return {
          success: false,
          message: 'ID do artigo, conteúdo e tenant são obrigatórios'
        };
      }

      // Check if article exists
      const article = await this.repository.findById(request.articleId, request.tenantId);
      if (!article) {
        return {
          success: false,
          message: 'Artigo não encontrado'
        };
      }

      const commentData = {
        articleId: request.articleId,
        content: request.content,
        rating: request.rating || 0,
        authorId: request.authorId,
        authorName: request.authorName
      };

      const comment = await this.repository.createComment(commentData, request.tenantId);

      this.logger.info('Comment created successfully', { 
        commentId: comment.id,
        articleId: request.articleId,
        tenantId: request.tenantId 
      });

      return {
        success: true,
        message: 'Comentário criado com sucesso',
        data: comment
      };

    } catch (error: any) {
      this.logger.error('Error creating comment', { 
        error: error.message,
        tenantId: request.tenantId 
      });

      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }
}