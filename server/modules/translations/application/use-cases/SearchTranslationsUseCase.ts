/**
 * Search Translations Use Case
 * Application layer use case for searching translations
 */

import { ITranslationRepository } from '../../domain/repositories/ITranslationRepository';
import { Translation } from '../../domain/entities/Translation';
import { TranslationSearchData } from '../dto/TranslationDTO';

interface SearchResult {
  translations: Translation[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export class SearchTranslationsUseCase {
  constructor(
    private translationRepository: ITranslationRepository
  ) {}

  async execute(
    data: TranslationSearchData,
    tenantId?: string
  ): Promise<SearchResult> {
    // Execute search
    const translations = await this.translationRepository.searchTranslations(
      data.query || '',
      data.language,
      data.module,
      tenantId
    );

    // Apply pagination
    const total = translations.length;
    const paginatedTranslations = translations.slice(
      data.offset,
      data.offset + data.limit
    );

    // Filter by global/tenant preference
    let filteredTranslations = paginatedTranslations;

    if (!data.includeGlobal && !data.includeTenant) {
      // If both are false, include all
      filteredTranslations = paginatedTranslations;
    } else if (data.includeGlobal && !data.includeTenant) {
      // Only global translations
      filteredTranslations = paginatedTranslations.filter(t => t.isGlobal);
    } else if (!data.includeGlobal && data.includeTenant) {
      // Only tenant-specific translations
      filteredTranslations = paginatedTranslations.filter(t => !t.isGlobal && t.tenantId === tenantId);
    }
    // If both are true, include all (default behavior)

    return {
      translations: filteredTranslations,
      total: filteredTranslations.length,
      offset: data.offset,
      limit: data.limit,
      hasMore: data.offset + data.limit < total
    };
  }
}