/**
 * APPLICATION LAYER - CREATE COMPANY USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Company, CompanyDomainService } from '../../domain/entities/Company';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { CreateCompanyDTO } from '../dto/CompanyDTO';

export class CreateCompanyUseCase {
  constructor(
    private companyRepository: ICompanyRepository,
    private companyDomainService: CompanyDomainService
  ) {}

  async execute(dto: CreateCompanyDTO): Promise<Company> {
    // Data normalization
    const normalizedData = this.normalizeCreateData(dto);

    // Domain validation
    const validation = this.companyDomainService.validateCompanyData(normalizedData);
    if (!validation.isValid) {
      throw new Error(`Company validation failed: ${validation.errors.join(', ')}`);
    }

    // Business rules validation
    await this.validateBusinessRules(normalizedData);

    // Create company
    const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId: normalizedData.tenantId!,
      name: normalizedData.name,
      displayName: normalizedData.displayName,
      description: normalizedData.description,
      cnpj: this.normalizeCNPJ(normalizedData.cnpj),
      industry: normalizedData.industry,
      size: normalizedData.size,
      status: normalizedData.status,
      subscriptionTier: normalizedData.subscriptionTier || this.companyDomainService.recommendSubscriptionTier(normalizedData.size),
      email: normalizedData.email?.toLowerCase(),
      phone: normalizedData.phone,
      website: normalizedData.website,
      address: normalizedData.address,
      addressNumber: normalizedData.addressNumber,
      complement: normalizedData.complement,
      neighborhood: normalizedData.neighborhood,
      city: normalizedData.city,
      state: normalizedData.state?.toUpperCase(),
      zipCode: normalizedData.zipCode,
      isActive: normalizedData.isActive ?? true
    };

    const createdCompany = await this.companyRepository.create(companyData);
    
    // Aplicar template se esta for a primeira empresa do tenant
    try {
      const { FirstCompanyTemplateService } = await import('../../../services/FirstCompanyTemplateService');
      await FirstCompanyTemplateService.applyTemplateIfFirstCompany(
        createdCompany.tenantId,
        createdCompany.id
      );
    } catch (templateError) {
      console.error(`⚠️ [CREATE-COMPANY] Template application failed for company ${createdCompany.id}:`, templateError);
      // Continue without failing company creation
    }
    
    return createdCompany;
  }

  private normalizeCreateData(dto: CreateCompanyDTO): CreateCompanyDTO {
    return {
      ...dto,
      name: dto.name?.trim(),
      displayName: dto.displayName?.trim(),
      description: dto.description?.trim(),
      cnpj: dto.cnpj?.replace(/\D/g, ''),
      industry: dto.industry?.trim(),
      email: dto.email?.toLowerCase().trim(),
      phone: dto.phone?.replace(/\D/g, ''),
      website: this.normalizeWebsite(dto.website),
      address: dto.address?.trim(),
      addressNumber: dto.addressNumber?.trim(),
      complement: dto.complement?.trim(),
      neighborhood: dto.neighborhood?.trim(),
      city: dto.city?.trim(),
      state: dto.state?.toUpperCase().trim(),
      zipCode: dto.zipCode?.replace(/\D/g, '')
    };
  }

  private normalizeWebsite(website?: string): string | undefined {
    if (!website?.trim()) return undefined;
    
    let normalized = website.trim().toLowerCase();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    
    return normalized;
  }

  private normalizeCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  private async validateBusinessRules(data: CreateCompanyDTO): Promise<void> {
    // Rule: CNPJ must be unique within tenant
    if (data.cnpj && data.tenantId) {
      const cnpjExists = await this.companyRepository.cnpjExists(
        this.normalizeCNPJ(data.cnpj), 
        data.tenantId
      );
      if (cnpjExists) {
        throw new Error('A company with this CNPJ already exists in your organization');
      }
    }

    // Rule: Email must be unique within tenant (if provided)
    if (data.email && data.tenantId) {
      const emailExists = await this.companyRepository.emailExists(
        data.email.toLowerCase(),
        data.tenantId
      );
      if (emailExists) {
        throw new Error('A company with this email already exists in your organization');
      }
    }

    // Rule: Company name should be unique within tenant (business recommendation)
    if (data.name && data.tenantId) {
      const nameExists = await this.companyRepository.nameExists(
        data.name.trim(),
        data.tenantId
      );
      if (nameExists) {
        // This is a warning, not a hard error - companies might have similar names
        console.warn(`[CREATE-COMPANY] Similar company name exists: ${data.name}`);
      }
    }

    // Rule: Required fields must be present
    if (!data.tenantId) {
      throw new Error('Tenant ID is required for company creation');
    }

    if (!data.name?.trim()) {
      throw new Error('Company name is required');
    }

    if (!data.cnpj?.trim()) {
      throw new Error('CNPJ is required');
    }

    if (!data.status) {
      throw new Error('Company status is required');
    }

    // Rule: CNPJ format and checksum validation
    if (!this.companyDomainService.validateCNPJ(data.cnpj)) {
      throw new Error('Invalid CNPJ format or checksum');
    }

    // Rule: Email format validation (if provided)
    if (data.email && !this.companyDomainService.validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Rule: Phone format validation (if provided)
    if (data.phone && !this.companyDomainService.validatePhone(data.phone)) {
      throw new Error('Invalid phone format');
    }

    // Rule: Brazilian state validation (if provided)
    if (data.state && !this.companyDomainService.validateBrazilianState(data.state)) {
      throw new Error('Invalid Brazilian state code');
    }

    // Rule: CEP validation (if provided)
    if (data.zipCode && !this.companyDomainService.validateCEP(data.zipCode)) {
      throw new Error('Invalid CEP format');
    }

    // Rule: Website URL validation (if provided)
    if (data.website && !this.companyDomainService.validateWebsite(data.website)) {
      throw new Error('Invalid website URL');
    }
  }

  async createWithDefaults(
    tenantId: string, 
    name: string, 
    cnpj: string, 
    createdById?: string
  ): Promise<Company> {
    const dto: CreateCompanyDTO = {
      tenantId,
      name: name.trim(),
      cnpj: cnpj.replace(/\D/g, ''),
      status: 'active',
      subscriptionTier: 'free',
      isActive: true,
      createdById
    };

    return await this.execute(dto);
  }

  async validateCreateData(dto: CreateCompanyDTO): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const normalizedData = this.normalizeCreateData(dto);
      
      // Domain validation
      const domainValidation = this.companyDomainService.validateCompanyData(normalizedData);
      if (!domainValidation.isValid) {
        return domainValidation;
      }

      // Business rules validation (without actually creating)
      await this.validateBusinessRules(normalizedData);
      
      return { isValid: true, errors: [] };
    } catch (error) {
      return { 
        isValid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}