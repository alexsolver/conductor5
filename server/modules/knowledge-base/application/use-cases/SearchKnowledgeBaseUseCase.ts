// ✅ 1QA.MD COMPLIANCE: SEARCH KNOWLEDGE BASE USE CASE - CLEAN ARCHITECTURE

import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';
import { KnowledgeBaseSearchResult } from '../../domain/entities/KnowledgeBase';
import { KnowledgeBaseSearchDTO } from '../dto/CreateKnowledgeBaseDTO';

export interface SearchKnowledgeBaseUseCaseResponse {
  success: boolean;
  data?: KnowledgeBaseSearchResult;
  message: string;
}

export class SearchKnowledgeBaseUseCase {
  constructor(private knowledgeBaseRepository: IKnowledgeBaseRepository) {}

  async execute(dto: KnowledgeBaseSearchDTO, tenantId: string): Promise<SearchKnowledgeBaseUseCaseResponse> {
    try {
      const searchQuery = {
        query: dto.query,
        category: dto.category,
        tags: dto.tags,
        status: dto.status,
        visibility: dto.visibility,
        authorId: dto.authorId,
        dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
        dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
        limit: dto.limit || 20,
        offset: dto.offset || 0,
        sortBy: dto.sortBy || 'updatedAt',
        sortOrder: dto.sortOrder || 'desc'
      };

      const result = await this.knowledgeBaseRepository.search(searchQuery, tenantId);

      return {
        success: true,
        data: result,
        message: 'Search completed successfully'
      };
    } catch (error) {
      console.error('❌ [SEARCH-KB-USE-CASE] Error:', error);
      return {
        success: false,
        message: 'Search failed'
      };
    }
  }
}