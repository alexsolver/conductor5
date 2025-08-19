// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - APPLICATION LAYER  
// Use Case para criação de versões de artigos seguindo padrões Domain-Driven Design

import { IKnowledgeBaseRepository } from "../../domain/repositories/IKnowledgeBaseRepository";
import { Logger } from "winston";

export interface CreateVersionRequest {
  articleId: string;
  changes: string;
  createdBy: string;
  tenantId: string;
}

export interface CreateVersionResponse {
  success: boolean;
  version?: any;
  message: string;
}

export class CreateVersionUseCase {
  constructor(
    private knowledgeBaseRepository: IKnowledgeBaseRepository,
    private logger: Logger
  ) {}

  async execute(request: CreateVersionRequest): Promise<CreateVersionResponse> {
    try {
      this.logger.info(`🔄 [CREATE-VERSION-UC] Creating version for article: ${request.articleId}`, {
        tenantId: request.tenantId,
        createdBy: request.createdBy
      });

      // Domain validation
      if (!request.articleId) {
        throw new Error('Article ID is required');
      }

      if (!request.changes?.trim()) {
        throw new Error('Change description is required');
      }

      if (!request.createdBy) {
        throw new Error('Creator user ID is required');
      }

      // Verify article exists
      const article = await this.knowledgeBaseRepository.findById(
        request.articleId,
        request.tenantId
      );

      if (!article) {
        throw new Error('Article not found');
      }

      // Get the current version number
      const lastVersion = await this.knowledgeBaseRepository.getLatestVersionNumber(
        request.articleId,
        request.tenantId
      );

      const versionNumber = (lastVersion || 0) + 1;

      // Create version with current article data
      const versionData = {
        articleId: request.articleId,
        versionNumber,
        title: article.title,
        content: article.content,
        summary: article.summary,
        changes: request.changes.trim(),
        createdBy: request.createdBy,
        tenantId: request.tenantId
      };

      const version = await this.knowledgeBaseRepository.createVersion(versionData);

      this.logger.info(`✅ [CREATE-VERSION-UC] Version created successfully`, {
        versionId: version.id,
        articleId: request.articleId,
        versionNumber,
        tenantId: request.tenantId
      });

      return {
        success: true,
        version,
        message: `Version ${versionNumber} created successfully`
      };

    } catch (error: any) {
      this.logger.error(`❌ [CREATE-VERSION-UC] Failed to create version`, {
        error: error.message,
        tenantId: request.tenantId,
        articleId: request.articleId
      });

      return {
        success: false,
        message: error.message || 'Failed to create version'
      };
    }
  }
}