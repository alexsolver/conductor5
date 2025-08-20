/**
 * Get Translation Stats Use Case
 * Application layer use case for translation statistics
 */

import { ITranslationRepository } from '../../domain/repositories/ITranslationRepository';
import { TranslationDomainService } from '../../domain/services/TranslationDomainService';
import { TranslationStatsData } from '../dto/TranslationDTO';

interface TranslationStatsResult {
  overview: {
    totalKeys: number;
    totalTranslations: number;
    languages: string[];
    modules: string[];
    lastUpdated: Date;
  };
  byLanguage: Record<string, {
    totalKeys: number;
    translatedKeys: number;
    missingKeys: number;
    completeness: number;
  }>;
  byModule?: Record<string, {
    totalKeys: number;
    translatedKeys: number;
    missingKeys: number;
    completeness: number;
  }>;
  gaps: Array<{
    language: string;
    module: string;
    missingKeys: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

export class GetTranslationStatsUseCase {
  constructor(
    private translationRepository: ITranslationRepository,
    private translationDomainService: TranslationDomainService
  ) {}

  async execute(
    data: TranslationStatsData,
    tenantId?: string
  ): Promise<TranslationStatsResult> {
    // Get overall statistics
    const stats = await this.translationRepository.getTranslationStats(
      data.language,
      tenantId
    );

    // Get gaps analysis
    const gaps = await this.translationRepository.getGapsAnalysis(tenantId);

    // Process statistics into structured format
    const result: TranslationStatsResult = {
      overview: {
        totalKeys: 0,
        totalTranslations: 0,
        languages: [],
        modules: [],
        lastUpdated: new Date()
      },
      byLanguage: {},
      gaps: []
    };

    // Process language statistics
    const languageStats = stats.languages || {};
    for (const [language, langStats] of Object.entries(languageStats)) {
      result.byLanguage[language] = {
        totalKeys: langStats.totalKeys || 0,
        translatedKeys: langStats.translatedKeys || 0,
        missingKeys: langStats.missingKeys || 0,
        completeness: this.translationDomainService.calculateCompleteness(
          langStats.totalKeys || 0,
          langStats.translatedKeys || 0
        )
      };
    }

    // Process module statistics if requested
    if (data.includeModuleBreakdown) {
      result.byModule = {};
      const moduleStats = stats.modules || {};
      for (const [module, modStats] of Object.entries(moduleStats)) {
        result.byModule[module] = {
          totalKeys: modStats.totalKeys || 0,
          translatedKeys: modStats.translatedKeys || 0,
          missingKeys: modStats.missingKeys || 0,
          completeness: this.translationDomainService.calculateCompleteness(
            modStats.totalKeys || 0,
            modStats.translatedKeys || 0
          )
        };
      }
    }

    // Process gaps with priority
    for (const gap of gaps) {
      for (const [module, missingKeys] of Object.entries(gap.moduleGaps)) {
        if (missingKeys.length > 0) {
          // Determine priority based on module and number of missing keys
          let priority: 'high' | 'medium' | 'low' = 'medium';
          
          if (['auth', 'system', 'core'].includes(module)) {
            priority = 'high';
          } else if (missingKeys.length > 10) {
            priority = 'high';
          } else if (missingKeys.length <= 3) {
            priority = 'low';
          }

          result.gaps.push({
            language: gap.language,
            module,
            missingKeys,
            priority
          });
        }
      }
    }

    // Calculate overview
    const allLanguages = Object.keys(result.byLanguage);
    const allModules = data.includeModuleBreakdown 
      ? Object.keys(result.byModule || {})
      : Object.keys(gaps.reduce((acc, gap) => ({ ...acc, ...gap.moduleGaps }), {}));

    result.overview = {
      totalKeys: Math.max(...Object.values(result.byLanguage).map(s => s.totalKeys), 0),
      totalTranslations: Object.values(result.byLanguage).reduce((sum, s) => sum + s.translatedKeys, 0),
      languages: allLanguages,
      modules: allModules,
      lastUpdated: new Date()
    };

    return result;
  }
}