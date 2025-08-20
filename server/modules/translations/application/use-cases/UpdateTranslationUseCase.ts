/**
 * Update Translation Use Case
 * Application layer use case for updating translations
 */

import { ITranslationRepository } from '../../domain/repositories/ITranslationRepository';
import { TranslationDomainService } from '../../domain/services/TranslationDomainService';
import { Translation } from '../../domain/entities/Translation';
import { UpdateTranslationData } from '../dto/TranslationDTO';

export class UpdateTranslationUseCase {
  constructor(
    private translationRepository: ITranslationRepository,
    private translationDomainService: TranslationDomainService
  ) {}

  async execute(
    translationId: string,
    data: UpdateTranslationData,
    userId: string,
    tenantId?: string
  ): Promise<Translation> {
    // Find existing translation
    const existingTranslation = await this.translationRepository.findById(translationId, tenantId);
    
    if (!existingTranslation) {
      throw new Error('Translation not found');
    }

    // Check tenant access
    if (tenantId && existingTranslation.tenantId !== tenantId) {
      throw new Error('Access denied to this translation');
    }

    // Validate value if provided
    if (data.value !== undefined) {
      const valueValidation = this.translationDomainService.validateTranslationValue(
        data.value,
        existingTranslation.key
      );
      if (!valueValidation.valid) {
        throw new Error(`Invalid translation value: ${valueValidation.errors.join(', ')}`);
      }
    }

    // Check if customizable
    if (!existingTranslation.isCustomizable) {
      throw new Error('This translation is not customizable');
    }

    // Prepare update data
    const updateData = {
      ...data,
      version: existingTranslation.version + 1,
      updatedBy: userId
    };

    // Update translation
    const updatedTranslation = await this.translationRepository.update(
      translationId,
      updateData,
      tenantId
    );

    // Invalidate cache
    await this.translationRepository.invalidateCache(
      this.translationDomainService.generateCacheKey(
        existingTranslation.key,
        existingTranslation.language,
        existingTranslation.tenantId
      ),
      existingTranslation.tenantId
    );

    // Create audit entry
    await this.translationRepository.createAuditEntry({
      translationKey: existingTranslation.key,
      language: existingTranslation.language,
      oldValue: existingTranslation.value,
      newValue: data.value || existingTranslation.value,
      action: 'update',
      tenantId: existingTranslation.tenantId,
      changedBy: userId
    });

    return updatedTranslation;
  }
}