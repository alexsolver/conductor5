// ✅ 1QA.MD COMPLIANCE: CREATE KNOWLEDGE BASE USE CASE - CLEAN ARCHITECTURE
// Application layer use case - orchestrates domain logic

import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { 
  KnowledgeBaseArticle, 
  ArticleStatus, 
  ApprovalStatus, 
  KnowledgeBaseBusinessRules 
} from '../../domain/entities/KnowledgeBase';
import { KnowledgeBaseDomainService } from '../../domain/services/KnowledgeBaseDomainService';
import { CreateKnowledgeBaseArticleDTO } from '../dto/CreateKnowledgeBaseDTO';

export interface CreateKnowledgeBaseUseCaseResponse {
  success: boolean;
  data?: KnowledgeBaseArticle;
  message: string;
  errors?: string[];
}

export class CreateKnowledgeBaseUseCase {
  constructor(
    private knowledgeBaseRepository: IKnowledgeBaseRepository
  ) {}

  async execute(dto: CreateKnowledgeBaseArticleDTO): Promise<CreateKnowledgeBaseUseCaseResponse> {
    try {
      // Validate input data
      const validation = this.validateInput(dto);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        };
      }

      // Sanitize tags using domain rules
      const sanitizedTags = KnowledgeBaseBusinessRules.sanitizeTags(dto.tags);

      // Create article entity
      const articleData: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        title: dto.title.trim(),
        content: dto.content,
        summary: dto.summary?.trim(),
        category: dto.category.trim(),
        tags: sanitizedTags,
        status: ArticleStatus.DRAFT,
        visibility: dto.visibility,
        authorId: dto.authorId,
        reviewerId: undefined,
        publishedAt: undefined,
        version: 1,
        tenantId: dto.tenantId,
        contentType: dto.contentType,
        attachments: [],
        approvalStatus: ApprovalStatus.NOT_SUBMITTED,
        approvalHistory: [],
        viewCount: 0,
        lastViewedAt: undefined,
        rating: undefined,
        ratingCount: 0
      };

      // Save to repository
      const createdArticle = await this.knowledgeBaseRepository.create(articleData, dto.tenantId);

      // Handle attachments if provided
      if (dto.attachments && dto.attachments.length > 0) {
        for (const attachmentDto of dto.attachments) {
          await this.knowledgeBaseRepository.addAttachment({
            articleId: createdArticle.id,
            fileName: attachmentDto.fileName,
            originalName: attachmentDto.originalName,
            fileSize: attachmentDto.fileSize,
            mimeType: attachmentDto.mimeType,
            url: attachmentDto.url,
            uploadedBy: attachmentDto.uploadedBy
          }, dto.tenantId);
        }

        // Reload article with attachments
        const updatedArticle = await this.knowledgeBaseRepository.findById(createdArticle.id, dto.tenantId);
        if (updatedArticle) {
          return {
            success: true,
            data: updatedArticle,
            message: 'Article created successfully with attachments'
          };
        }
      }

      return {
        success: true,
        data: createdArticle,
        message: 'Article created successfully'
      };

    } catch (error) {
      console.error('❌ [CREATE-KB-USE-CASE] Error creating article:', error);
      return {
        success: false,
        message: 'Failed to create article'
      };
    }
  }

  private validateInput(dto: CreateKnowledgeBaseArticleDTO): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!dto.title || dto.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (!KnowledgeBaseBusinessRules.validateTitle(dto.title)) {
      errors.push('Title must be between 3 and 200 characters');
    }

    if (!dto.content || dto.content.trim().length === 0) {
      errors.push('Content is required');
    } else if (!KnowledgeBaseBusinessRules.validateContent(dto.content)) {
      errors.push('Content must be at least 10 characters long');
    }

    if (!dto.category || dto.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (!dto.authorId || dto.authorId.trim().length === 0) {
      errors.push('Author ID is required');
    }

    if (!dto.tenantId || dto.tenantId.trim().length === 0) {
      errors.push('Tenant ID is required');
    }

    // Validate content type
    const validContentTypes = ['rich_text', 'markdown', 'html'];
    if (!validContentTypes.includes(dto.contentType)) {
      errors.push('Invalid content type');
    }

    // Validate tags
    if (dto.tags && dto.tags.length > 20) {
      errors.push('Maximum 20 tags allowed');
    }

    // Validate attachments
    if (dto.attachments) {
      for (let i = 0; i < dto.attachments.length; i++) {
        const attachment = dto.attachments[i];
        if (!attachment.fileName || attachment.fileName.trim().length === 0) {
          errors.push(`Attachment ${i + 1}: File name is required`);
        }
        if (!attachment.originalName || attachment.originalName.trim().length === 0) {
          errors.push(`Attachment ${i + 1}: Original name is required`);
        }
        if (!attachment.url || attachment.url.trim().length === 0) {
          errors.push(`Attachment ${i + 1}: URL is required`);
        }
        if (attachment.fileSize <= 0) {
          errors.push(`Attachment ${i + 1}: Invalid file size`);
        }
        // Max file size 50MB
        if (attachment.fileSize > 50 * 1024 * 1024) {
          errors.push(`Attachment ${i + 1}: File size exceeds 50MB limit`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}