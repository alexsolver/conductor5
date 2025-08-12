/**
 * APPLICATION LAYER - FIND CUSTOMER USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Customer, CustomerDomainService } from '../../domain/entities/Customer';
import { ICustomerRepository, CustomerFilters, PaginationOptions, CustomerListResult } from '../../domain/repositories/ICustomerRepository';

export class FindCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private customerDomainService: CustomerDomainService
  ) {}

  async findById(customerId: string, tenantId?: string): Promise<Customer | null> {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // If tenant scope is provided, use tenant-scoped search
    if (tenantId) {
      return await this.customerRepository.findByIdAndTenant(customerId, tenantId);
    }

    return await this.customerRepository.findById(customerId);
  }

  async findWithFilters(
    filters: CustomerFilters,
    pagination: PaginationOptions,
    tenantId?: string
  ): Promise<CustomerListResult> {
    // Validate pagination parameters
    if (pagination.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (pagination.limit < 1 || pagination.limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }

    // Normalize filters
    const normalizedFilters = this.normalizeFilters(filters);

    const result = await this.customerRepository.findWithFilters(
      normalizedFilters, 
      pagination, 
      tenantId
    );

    return result;
  }

  async findByEmail(email: string, tenantId?: string): Promise<Customer | null> {
    if (!email) {
      throw new Error('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (tenantId) {
      return await this.customerRepository.findByEmailAndTenant(normalizedEmail, tenantId);
    }

    return await this.customerRepository.findByEmail(normalizedEmail);
  }

  async findByCPF(cpf: string, tenantId: string): Promise<Customer | null> {
    if (!cpf) {
      throw new Error('CPF is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Validate CPF format
    this.customerDomainService.validateCPF(cpf);

    const cleanCpf = cpf.replace(/\D/g, '');
    return await this.customerRepository.findByCPFAndTenant(cleanCpf, tenantId);
  }

  async findByCNPJ(cnpj: string, tenantId: string): Promise<Customer | null> {
    if (!cnpj) {
      throw new Error('CNPJ is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Validate CNPJ format
    this.customerDomainService.validateCNPJ(cnpj);

    const cleanCnpj = cnpj.replace(/\D/g, '');
    return await this.customerRepository.findByCNPJAndTenant(cleanCnpj, tenantId);
  }

  async findByTenant(tenantId: string): Promise<Customer[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.customerRepository.findByTenant(tenantId);
  }

  async findByType(customerType: 'PF' | 'PJ', tenantId: string): Promise<Customer[]> {
    if (!customerType) {
      throw new Error('Customer type is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!['PF', 'PJ'].includes(customerType)) {
      throw new Error('Customer type must be PF or PJ');
    }

    return await this.customerRepository.findByTypeAndTenant(customerType, tenantId);
  }

  async findByLocation(state?: string, city?: string, tenantId?: string): Promise<Customer[]> {
    return await this.customerRepository.findByLocationAndTenant(state, city, tenantId);
  }

  async searchCustomers(
    searchTerm: string,
    tenantId?: string,
    pagination?: PaginationOptions
  ): Promise<CustomerListResult> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    const normalizedSearchTerm = searchTerm.trim();

    return await this.customerRepository.searchCustomers(
      normalizedSearchTerm, 
      tenantId, 
      pagination
    );
  }

  async getStatistics(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<'PF' | 'PJ', number>;
    byState: Record<string, number>;
    recentCustomers: number;
  }> {
    return await this.customerRepository.getStatistics(tenantId);
  }

  async validateAccess(customerId: string, requesterTenantId: string): Promise<boolean> {
    const customer = await this.customerRepository.findByIdAndTenant(customerId, requesterTenantId);
    return customer !== null;
  }

  async getCustomerProfile(customerId: string, tenantId: string): Promise<any | null> {
    const customer = await this.customerRepository.findByIdAndTenant(customerId, tenantId);
    
    if (!customer) {
      return null;
    }

    // Create profile with formatted data
    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: this.customerDomainService.createFullName(customer.firstName, customer.lastName),
      displayName: this.customerDomainService.getDisplayName(customer),
      email: customer.email,
      phone: customer.phone,
      mobilePhone: customer.mobilePhone,
      customerType: customer.customerType,
      cpf: customer.cpf,
      cnpj: customer.cnpj,
      companyName: customer.companyName,
      contactPerson: customer.contactPerson,
      
      // Formatted fields
      formattedCPF: this.customerDomainService.formatCPF(customer.cpf),
      formattedCNPJ: this.customerDomainService.formatCNPJ(customer.cnpj),
      formattedPhone: this.customerDomainService.formatPhone(customer.phone),
      formattedMobilePhone: this.customerDomainService.formatPhone(customer.mobilePhone),
      
      // Address
      address: {
        street: customer.address,
        number: customer.addressNumber,
        complement: customer.complement,
        neighborhood: customer.neighborhood,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode
      },
      
      // System fields
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    };
  }

  async findRecentCustomers(tenantId: string, days: number = 30): Promise<Customer[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (days < 1 || days > 365) {
      throw new Error('Days must be between 1 and 365');
    }

    return await this.customerRepository.findRecentCustomers(tenantId, days);
  }

  async findByCompanyName(companyName: string, tenantId: string): Promise<Customer[]> {
    if (!companyName || companyName.trim().length === 0) {
      throw new Error('Company name is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.customerRepository.findByCompanyName(companyName.trim(), tenantId);
  }

  private normalizeFilters(filters: CustomerFilters): CustomerFilters {
    const normalized: CustomerFilters = { ...filters };

    // Normalize search term
    if (normalized.search) {
      normalized.search = normalized.search.trim();
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