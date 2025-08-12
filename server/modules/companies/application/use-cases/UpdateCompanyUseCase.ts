/**
 * APPLICATION LAYER - UPDATE COMPANY USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Company, CompanyDomainService } from '../../domain/entities/Company';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { UpdateCompanyDTO } from '../dto/CompanyDTO';

export class UpdateCompanyUseCase {
  constructor(
    private companyRepository: ICompanyRepository,
    private companyDomainService: CompanyDomainService
  ) {}

  async execute(companyId: string, dto: UpdateCompanyDTO): Promise<Company> {
    // Check if company exists
    const existingCompany = await this.companyRepository.findById(companyId);
    if (!existingCompany) {
      throw new Error('Company not found');
    }

    if (!existingCompany.isActive) {
      throw new Error('Cannot update inactive company');
    }

    // Data normalization
    const normalizedData = this.normalizeUpdateData(dto);

    // Create merged data for validation
    const mergedData = this.mergeCompanyData(existingCompany, normalizedData);

    // Domain validation
    const validation = this.companyDomainService.validateCompanyData(mergedData);
    if (!validation.isValid) {
      throw new Error(`Company validation failed: ${validation.errors.join(', ')}`);
    }

    // Business rules validation
    await this.validateBusinessRules(companyId, normalizedData, existingCompany);

    // Apply business rules for updates
    const updateData = await this.applyUpdateBusinessRules(normalizedData, existingCompany);

    // Update company
    const updatedCompany = await this.companyRepository.update(companyId, updateData);
    
    return updatedCompany;
  }

  async updateByTenantScope(companyId: string, tenantId: string, dto: UpdateCompanyDTO): Promise<Company> {
    // Check if company exists within tenant scope
    const existingCompany = await this.companyRepository.findByIdAndTenant(companyId, tenantId);
    if (!existingCompany) {
      throw new Error('Company not found in your organization');
    }

    return await this.execute(companyId, dto);
  }

  private normalizeUpdateData(dto: UpdateCompanyDTO): UpdateCompanyDTO {
    return {
      ...dto,
      name: dto.name?.trim(),
      displayName: dto.displayName?.trim(),
      description: dto.description?.trim(),
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

  private mergeCompanyData(existing: Company, updates: UpdateCompanyDTO): Partial<Company> {
    return {
      name: updates.name ?? existing.name,
      displayName: updates.displayName ?? existing.displayName,
      description: updates.description ?? existing.description,
      cnpj: existing.cnpj, // CNPJ cannot be changed after creation
      industry: updates.industry ?? existing.industry,
      size: updates.size ?? existing.size,
      status: updates.status ?? existing.status,
      subscriptionTier: updates.subscriptionTier ?? existing.subscriptionTier,
      email: updates.email ?? existing.email,
      phone: updates.phone ?? existing.phone,
      website: updates.website ?? existing.website,
      address: updates.address ?? existing.address,
      addressNumber: updates.addressNumber ?? existing.addressNumber,
      complement: updates.complement ?? existing.complement,
      neighborhood: updates.neighborhood ?? existing.neighborhood,
      city: updates.city ?? existing.city,
      state: updates.state ?? existing.state,
      zipCode: updates.zipCode ?? existing.zipCode,
      isActive: updates.isActive ?? existing.isActive
    };
  }

  private async validateBusinessRules(
    companyId: string, 
    data: UpdateCompanyDTO, 
    existing: Company
  ): Promise<void> {
    // Rule: Email must be unique within tenant (if being changed)
    if (data.email && data.email !== existing.email) {
      const emailExists = await this.companyRepository.emailExists(
        data.email.toLowerCase(),
        existing.tenantId,
        companyId
      );
      if (emailExists) {
        throw new Error('A company with this email already exists in your organization');
      }
    }

    // Rule: Company name should be unique within tenant (if being changed)
    if (data.name && data.name !== existing.name) {
      const nameExists = await this.companyRepository.nameExists(
        data.name.trim(),
        existing.tenantId,
        companyId
      );
      if (nameExists) {
        console.warn(`[UPDATE-COMPANY] Similar company name exists: ${data.name}`);
      }
    }

    // Rule: CNPJ cannot be changed after creation
    if ('cnpj' in data) {
      throw new Error('CNPJ cannot be modified after company creation');
    }

    // Rule: Validate field formats
    if (data.email && !this.companyDomainService.validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.phone && !this.companyDomainService.validatePhone(data.phone)) {
      throw new Error('Invalid phone format');
    }

    if (data.state && !this.companyDomainService.validateBrazilianState(data.state)) {
      throw new Error('Invalid Brazilian state code');
    }

    if (data.zipCode && !this.companyDomainService.validateCEP(data.zipCode)) {
      throw new Error('Invalid CEP format');
    }

    if (data.website && !this.companyDomainService.validateWebsite(data.website)) {
      throw new Error('Invalid website URL');
    }

    // Rule: Status change validation
    if (data.status && this.isStatusChangeRestricted(existing.status, data.status)) {
      throw new Error(`Cannot change status from ${existing.status} to ${data.status}`);
    }
  }

  private isStatusChangeRestricted(currentStatus: string, newStatus: string): boolean {
    // Business rule: Suspended companies can only be reactivated or remain suspended
    if (currentStatus === 'suspended' && !['active', 'suspended'].includes(newStatus)) {
      return true;
    }

    // Business rule: Pending companies can be activated or rejected (inactive)
    if (currentStatus === 'pending' && !['active', 'inactive', 'suspended'].includes(newStatus)) {
      return true;
    }

    return false;
  }

  private async applyUpdateBusinessRules(
    data: UpdateCompanyDTO, 
    existing: Company
  ): Promise<Partial<Company>> {
    const updateData: Partial<Company> = { ...data };

    // Business rule: Auto-update display name if name changed
    if (data.name && data.name !== existing.name && !data.displayName) {
      updateData.displayName = this.companyDomainService.createDisplayName(data.name);
    }

    // Business rule: Format phone number
    if (data.phone) {
      updateData.phone = data.phone.replace(/\D/g, '');
    }

    // Business rule: Format ZIP code
    if (data.zipCode) {
      updateData.zipCode = data.zipCode.replace(/\D/g, '');
    }

    // Business rule: Normalize state code
    if (data.state) {
      updateData.state = data.state.toUpperCase();
    }

    // Business rule: Normalize email
    if (data.email) {
      updateData.email = data.email.toLowerCase();
    }

    return updateData;
  }

  async bulkUpdate(companyIds: string[], updates: Partial<Company>): Promise<Company[]> {
    // Validate all companies exist and are active
    for (const id of companyIds) {
      const company = await this.companyRepository.findById(id);
      if (!company) {
        throw new Error(`Company ${id} not found`);
      }
      if (!company.isActive) {
        throw new Error(`Company ${id} is inactive and cannot be updated`);
      }
    }

    // Apply bulk update
    return await this.companyRepository.bulkUpdate(companyIds, updates);
  }

  async changeCompanyStatus(
    companyId: string, 
    newStatus: string, 
    updatedById?: string
  ): Promise<Company> {
    const dto: UpdateCompanyDTO = {
      status: newStatus as any,
      updatedById
    };

    return await this.execute(companyId, dto);
  }

  async upgradeSubscription(
    companyId: string, 
    newTier: string,
    updatedById?: string
  ): Promise<Company> {
    const dto: UpdateCompanyDTO = {
      subscriptionTier: newTier as any,
      updatedById
    };

    return await this.execute(companyId, dto);
  }

  async validateUpdateData(
    companyId: string, 
    dto: UpdateCompanyDTO
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const existingCompany = await this.companyRepository.findById(companyId);
      if (!existingCompany) {
        return { isValid: false, errors: ['Company not found'] };
      }

      const normalizedData = this.normalizeUpdateData(dto);
      const mergedData = this.mergeCompanyData(existingCompany, normalizedData);
      
      // Domain validation
      const domainValidation = this.companyDomainService.validateCompanyData(mergedData);
      if (!domainValidation.isValid) {
        return domainValidation;
      }

      // Business rules validation
      await this.validateBusinessRules(companyId, normalizedData, existingCompany);
      
      return { isValid: true, errors: [] };
    } catch (error) {
      return { 
        isValid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}