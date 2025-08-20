/**
 * Bulk Import Translations Use Case
 * Application layer use case for bulk importing translations
 */

import { ITranslationRepository } from '../../domain/repositories/ITranslationRepository';
import { TranslationDomainService } from '../../domain/services/TranslationDomainService';
import { Translation } from '../../domain/entities/Translation';
import { BulkImportData } from '../dto/TranslationDTO';

interface BulkImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  translations: Translation[];
}

export class BulkImportTranslationsUseCase {
  constructor(
    private translationRepository: ITranslationRepository,
    private translationDomainService: TranslationDomainService
  ) {}

  async execute(
    data: BulkImportData,
    userId: string,
    tenantId?: string
  ): Promise<BulkImportResult> {
    // Validate import data
    const validation = this.translationDomainService.validateBulkImport(data);
    if (!validation.valid) {
      throw new Error(`Invalid import data: ${validation.errors.join(', ')}`);
    }

    // If validate only, return early
    if (data.validateOnly) {
      return {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        translations: []
      };
    }

    const result: BulkImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      translations: []
    };

    const translationsToCreate: Array<Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>> = [];
    const translationsToUpdate: Array<{ id: string; translation: Partial<Translation> }> = [];

    // Process each translation
    for (const [key, value] of Object.entries(data.translations)) {
      try {
        // Extract module from key if not provided
        const module = data.module || this.translationDomainService.extractModuleFromKey(key);

        // Check if translation exists
        const existingTranslation = await this.translationRepository.findByKey(
          key,
          data.language,
          tenantId
        );

        // Determine if requires tenant isolation
        const requiresTenantIsolation = this.translationDomainService.requiresTenantIsolation(key, tenantId);
        const finalTenantId = requiresTenantIsolation ? tenantId : undefined;

        if (existingTranslation) {
          if (data.overwrite) {
            // Update existing translation
            translationsToUpdate.push({
              id: existingTranslation.id,
              translation: {
                value,
                version: existingTranslation.version + 1,
                updatedBy: userId
              }
            });
          } else {
            result.skipped++;
          }
        } else {
          // Create new translation
          translationsToCreate.push({
            key,
            language: data.language,
            value,
            module,
            tenantId: finalTenantId,
            isGlobal: !finalTenantId,
            isCustomizable: this.translationDomainService.isModuleCustomizable(module),
            version: 1,
            createdBy: userId
          });
        }
      } catch (error: any) {
        result.errors.push(`Error processing key "${key}": ${error.message}`);
      }
    }

    // Execute bulk operations
    try {
      if (translationsToCreate.length > 0) {
        const createdTranslations = await this.translationRepository.bulkCreate(translationsToCreate);
        result.translations.push(...createdTranslations);
        result.created = createdTranslations.length;

        // Create audit entries for created translations
        for (const translation of createdTranslations) {
          await this.translationRepository.createAuditEntry({
            translationKey: translation.key,
            language: translation.language,
            newValue: translation.value,
            action: 'create',
            tenantId: translation.tenantId,
            changedBy: userId
          });
        }
      }

      if (translationsToUpdate.length > 0) {
        const updatedTranslations = await this.translationRepository.bulkUpdate(
          translationsToUpdate,
          tenantId
        );
        result.translations.push(...updatedTranslations);
        result.updated = updatedTranslations.length;

        // Create audit entries for updated translations
        for (const translation of updatedTranslations) {
          await this.translationRepository.createAuditEntry({
            translationKey: translation.key,
            language: translation.language,
            newValue: translation.value,
            action: 'update',
            tenantId: translation.tenantId,
            changedBy: userId
          });
        }
      }

      // Invalidate cache for affected translations
      await this.translationRepository.invalidateCache(
        `translation:*:${data.language}:*`,
        tenantId
      );

    } catch (error: any) {
      result.errors.push(`Bulk operation failed: ${error.message}`);
    }

    return result;
  }
}