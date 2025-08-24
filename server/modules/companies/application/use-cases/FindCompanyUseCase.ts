/**
 * APPLICATION LAYER - FIND COMPANY USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Company, CompanyDomainService } from '../../domain/entities/Company';
import { ICompanyRepository, CompanyFilters, PaginationOptions, CompanyListResult } from '../../domain/repositories/ICompanyRepository';

export class FindCompanyUseCase {
  constructor(
    private companyRepository: ICompanyRepository,
    private companyDomainService: CompanyDomainService
  ) {}

  async findById(companyId: string, tenantId?: string): Promise<Company | null> {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // If tenant scope is provided, use tenant-scoped search
    if (tenantId) {
      return await this.companyRepository.findByIdAndTenant(companyId, tenantId);
    }

    return await this.companyRepository.findById(companyId);
  }

  async findWithFilters(
    filters: CompanyFilters,
    pagination: PaginationOptions,
    tenantId?: string
  ): Promise<CompanyListResult> {
    // Validate pagination parameters
    if (pagination.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (pagination.limit < 1 || pagination.limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }

    // Normalize filters
    const normalizedFilters = this.normalizeFilters(filters);

    const result = await this.companyRepository.findWithFilters(
      normalizedFilters, 
      pagination, 
      tenantId
    );

    return result;
  }

  async findByEmail(email: string, tenantId?: string): Promise<Company | null> {
    if (!email) {
      throw new Error('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (tenantId) {
      return await this.companyRepository.findByEmailAndTenant(normalizedEmail, tenantId);
    }

    return await this.companyRepository.findByEmail(normalizedEmail);
  }

  async findByCNPJ(cnpj: string, tenantId?: string): Promise<Company | null> {
    if (!cnpj) {
      throw new Error('CNPJ is required');
    }

    // Validate CNPJ format
    this.companyDomainService.validateCNPJ(cnpj);

    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (tenantId) {
      return await this.companyRepository.findByCNPJAndTenant(cleanCnpj, tenantId);
    }

    return await this.companyRepository.findByCNPJ(cleanCnpj);
  }

  async findByName(name: string, tenantId: string): Promise<Company[]> {
    if (!name || name.trim().length === 0) {
      throw new Error('Company name is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.companyRepository.findByName(name.trim(), tenantId);
  }

  async findByTenant(tenantId: string): Promise<Company[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.companyRepository.findByTenant(tenantId);
  }

  async findByStatus(status: string, tenantId: string): Promise<Company[]> {
    if (!status) {
      throw new Error('Status is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.companyDomainService.validateCompanyStatus(status as any)) {
      throw new Error('Invalid company status');
    }

    return await this.companyRepository.findByStatusAndTenant(status as any, tenantId);
  }

  async findBySize(size: string, tenantId: string): Promise<Company[]> {
    if (!size) {
      throw new Error('Size is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.companyDomainService.validateCompanySize(size as any)) {
      throw new Error('Invalid company size');
    }

    return await this.companyRepository.findBySizeAndTenant(size as any, tenantId);
  }

  async findBySubscription(tier: string, tenantId: string): Promise<Company[]> {
    if (!tier) {
      throw new Error('Subscription tier is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.companyDomainService.validateSubscriptionTier(tier as any)) {
      throw new Error('Invalid subscription tier');
    }

    return await this.companyRepository.findBySubscriptionAndTenant(tier as any, tenantId);
  }

  async findByLocation(state?: string, city?: string, tenantId?: string): Promise<Company[]> {
    return await this.companyRepository.findByLocationAndTenant(state, city, tenantId);
  }

  async findByIndustry(industry: string, tenantId: string): Promise<Company[]> {
    if (!industry || industry.trim().length === 0) {
      throw new Error('Industry is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.companyRepository.findByIndustry(industry.trim(), tenantId);
  }

  async searchCompanies(
    searchTerm: string,
    tenantId?: string,
    pagination?: PaginationOptions
  ): Promise<CompanyListResult> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    const normalizedSearchTerm = searchTerm.trim();

    return await this.companyRepository.searchCompanies(
      normalizedSearchTerm, 
      tenantId, 
      pagination
    );
  }

  async getStatistics(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    bySize: Record<string, number>;
    bySubscription: Record<string, number>;
    byState: Record<string, number>;
    byIndustry: Record<string, number>;
    recentCompanies: number;
  }> {
    const stats = await this.companyRepository.getStatistics(tenantId);

    // Convert to more readable format for frontend
    return {
      total: stats.total,
      active: stats.active,
      inactive: stats.inactive,
      suspended: stats.suspended,
      bySize: stats.bySize,
      bySubscription: stats.bySubscription,
      byState: stats.byState,
      byIndustry: {}, // Would be populated if implemented
      recentCompanies: stats.recentCompanies
    };
  }

  async validateAccess(companyId: string, requesterTenantId: string): Promise<boolean> {
    const company = await this.companyRepository.findByIdAndTenant(companyId, requesterTenantId);
    return company !== null;
  }

  async getCompanyProfile(companyId: string, tenantId: string): Promise<any | null> {
    const company = await this.companyRepository.findByIdAndTenant(companyId, tenantId);

    if (!company) {
      return null;
    }

    // Create profile with formatted data
    const displayData = this.companyDomainService.formatCompanyDisplay(company);

    return {
      id: company.id,
      name: company.name,
      displayName: displayData.displayName,
      description: company.description,
      cnpj: company.cnpj,
      formattedCNPJ: displayData.formattedCNPJ,
      industry: company.industry,
      size: company.size,
      status: company.status,
      subscriptionTier: company.subscriptionTier,

      // Contact information
      email: company.email,
      phone: company.phone,
      formattedPhone: displayData.formattedPhone,
      website: company.website,

      // Address information
      address: {
        street: company.address,
        number: company.addressNumber,
        complement: company.complement,
        neighborhood: company.neighborhood,
        city: company.city,
        state: company.state,
        zipCode: company.zipCode,
        formattedZipCode: displayData.formattedZipCode,
        fullAddress: displayData.fullAddress
      },

      // Business identifiers
      companyCode: this.companyDomainService.generateCompanyCode(company.name, company.cnpj),

      // System fields
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),

      // Additional metrics (would be populated from related data)
      customerCount: 0,
      ticketCount: 0
    };
  }

  async findRecentCompanies(tenantId: string, days: number = 30): Promise<Company[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (days < 1 || days > 365) {
      throw new Error('Days must be between 1 and 365');
    }

    return await this.companyRepository.findRecentCompanies(tenantId, days);
  }

  async getCompanyCustomerCount(companyId: string, tenantId: string): Promise<number> {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Validate company access
    const hasAccess = await this.validateAccess(companyId, tenantId);
    if (!hasAccess) {
      throw new Error('Company not found in your organization');
    }

    return await this.companyRepository.getCompanyCustomerCount(companyId, tenantId);
  }

  async getCompanyTicketCount(companyId: string, tenantId: string): Promise<number> {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Validate company access
    const hasAccess = await this.validateAccess(companyId, tenantId);
    if (!hasAccess) {
      throw new Error('Company not found in your organization');
    }

    return await this.companyRepository.getCompanyTicketCount(companyId, tenantId);
  }

  async findExpiredSubscriptions(tenantId: string): Promise<Company[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.companyRepository.findExpiredSubscriptions(tenantId);
  }

  async findCompaniesByCustomerIds(customerIds: string[], tenantId: string): Promise<Company[]> {
    if (!customerIds || customerIds.length === 0) {
      throw new Error('Customer IDs are required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.companyRepository.findCompaniesByCustomerIds(customerIds, tenantId);
  }

  private normalizeFilters(filters: CompanyFilters): CompanyFilters {
    const normalized: CompanyFilters = { ...filters };

    // Normalize search term
    if (normalized.search) {
      normalized.search = normalized.search.trim();
    }

    // Normalize name
    if (normalized.name) {
      normalized.name = normalized.name.trim();
    }

    // Normalize CNPJ
    if (normalized.cnpj) {
      normalized.cnpj = normalized.cnpj.replace(/\D/g, '');
    }

    // Normalize industry
    if (normalized.industry) {
      normalized.industry = normalized.industry.trim();
    }

    // Normalize state
    if (normalized.state) {
      normalized.state = normalized.state.toUpperCase().trim();
    }

    // Normalize city
    if (normalized.city) {
      normalized.city = normalized.city.trim();
    }

    return normalized;
  }
}