/**
 * Create Customer Company Use Case
 * Clean Architecture - Application Layer
 * Orchestrates the creation of a new customer company
 */

import { CustomerCompany } from '../../domain/entities/CustomerCompany''[,;]
import { ICustomerCompanyRepository } from '../../domain/ports/ICustomerCompanyRepository''[,;]

export interface CreateCustomerCompanyRequest {
  tenantId: string;
  name: string;
  displayName?: string;
  description?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise''[,;]
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  subscriptionTier?: 'basic' | 'premium' | 'enterprise''[,;]
  createdBy: string;
}

export interface CreateCustomerCompanyResponse {
  company: CustomerCompany;
}

export class CreateCustomerCompanyUseCase {
  constructor(
    private readonly customerCompanyRepository: ICustomerCompanyRepository
  ) {}

  async execute(request: CreateCustomerCompanyRequest): Promise<CreateCustomerCompanyResponse> {
    // Check if company with same name already exists in tenant
    const existingCompany = await this.customerCompanyRepository.findByName(
      request.name,
      request.tenantId
    );

    if (existingCompany) {
      throw new Error(`Company with name "${request.name}" already exists in this tenant`);
    }

    // Create new company domain entity
    const company = CustomerCompany.create({
      tenantId: request.tenantId,
      name: request.name,
      displayName: request.displayName,
      description: request.description,
      industry: request.industry,
      size: request.size,
      email: request.email,
      phone: request.phone,
      website: request.website,
      address: request.address,
      subscriptionTier: request.subscriptionTier,
      createdBy: request.createdBy,
    });

    // Save to repository
    const savedCompany = await this.customerCompanyRepository.save(company);

    return {
      company: savedCompany,
    };
  }
}