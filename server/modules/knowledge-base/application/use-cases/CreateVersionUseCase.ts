// ✅ 1QA.MD COMPLIANCE: USE CASE - CLEAN ARCHITECTURE
// Application layer use case for version creation

import { Logger } from 'winston';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export interface CreateVersionRequest {
  articleId: string;
  title: string;
  changeDescription: string;
  authorId: string;
  authorName: string;
  tenantId: string;
}

export interface CreateVersionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class CreateVersionUseCase {
  constructor(
    private repository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(request: CreateVersionRequest): Promise<CreateVersionResponse> {
    try {
      this.logger.info('Creating version', { 
        articleId: request.articleId,
        tenantId: request.tenantId 
      });

      // Validate required fields
      if (!request.articleId || !request.title || !request.tenantId) {
        return {
          success: false,
          message: 'ID do artigo, título e tenant são obrigatórios'
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

      // Get existing versions to determine next version number
      const existingVersions = await this.repository.findVersionsByArticle(
        request.articleId, 
        request.tenantId
      );

      const nextVersion = existingVersions.length + 1;

      const versionData = {
        articleId: request.articleId,
        version: nextVersion,
        title: request.title,
        changeDescription: request.changeDescription || 'Versão criada',
        authorId: request.authorId,
        authorName: request.authorName,
        content: article.content // Save current content as snapshot
      };

      const version = await this.repository.createVersion(versionData, request.tenantId);

      // Update article version number
      await this.repository.update(
        request.articleId,
        { version: nextVersion },
        request.tenantId
      );

      this.logger.info('Version created successfully', { 
        versionId: version.id,
        articleId: request.articleId,
        version: nextVersion,
        tenantId: request.tenantId 
      });

      return {
        success: true,
        message: 'Versão criada com sucesso',
        data: version
      };

    } catch (error: any) {
      this.logger.error('Error creating version', { 
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