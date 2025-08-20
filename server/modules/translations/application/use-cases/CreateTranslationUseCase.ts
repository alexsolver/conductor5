/**
 * Create Translation Use Case
 * Application layer use case for creating translations
 */

import { ITranslationRepository } from '../../domain/repositories/ITranslationRepository';
import { TranslationDomainService } from '../../domain/services/TranslationDomainService';
import { Translation } from '../../domain/entities/Translation';
import { CreateTranslationData } from '../dto/TranslationDTO';

export class CreateTranslationUseCase {
  constructor(
    private translationRepository: ITranslationRepository,
    private translationDomainService: TranslationDomainService
  ) {}

  async execute(
    data: CreateTranslationData,
    userId: string,
    tenantId?: string
  ): Promise<Translation> {
    // Validate language support
    if (!this.translationDomainService.isLanguageSupported(data.language)) {
      throw new Error(`Unsupported language: ${data.language}`);
    }

    // Validate key format
    const keyValidation = this.translationDomainService.validateTranslationKey(data.key);
    if (!keyValidation.valid) {
      throw new Error(`Invalid translation key: ${keyValidation.errors.join(', ')}`);
    }

    // Validate value
    const valueValidation = this.translationDomainService.validateTranslationValue(data.value, data.key);
    if (!valueValidation.valid) {
      throw new Error(`Invalid translation value: ${valueValidation.errors.join(', ')}`);
    }

    // Check if module is customizable for tenant-specific translations
    if (tenantId && !data.isGlobal && !this.translationDomainService.isModuleCustomizable(data.module)) {
      throw new Error(`Module "${data.module}" is not customizable for tenant-specific translations`);
    }

    // Check if translation already exists
    const existingTranslation = await this.translationRepository.findByKey(
      data.key,
      data.language,
      tenantId
    );

    if (existingTranslation) {
      throw new Error(`Translation already exists for key "${data.key}" in language "${data.language}"`);
    }

    // Extract module from key if not provided
    const module = data.module || this.translationDomainService.extractModuleFromKey(data.key);

    // Determine if requires tenant isolation
    const requiresTenantIsolation = this.translationDomainService.requiresTenantIsolation(data.key, tenantId);
    const finalTenantId = requiresTenantIsolation ? tenantId : undefined;

    // Create translation
    const translationData = {
      key: data.key,
      language: data.language,
      value: data.value,
      module,
      context: data.context,
      tenantId: finalTenantId,
      isGlobal: !finalTenantId,
      isCustomizable: data.isCustomizable,
      version: 1,
      createdBy: userId
    };

    const translation = await this.translationRepository.create(translationData);

    // Invalidate cache
    await this.translationRepository.invalidateCache(
      this.translationDomainService.generateCacheKey(data.key, data.language, finalTenantId),
      finalTenantId
    );

    // Create audit entry
    await this.translationRepository.createAuditEntry({
      translationKey: data.key,
      language: data.language,
      newValue: data.value,
      action: 'create',
      tenantId: finalTenantId,
      changedBy: userId
    });

    return translation;
  }
}