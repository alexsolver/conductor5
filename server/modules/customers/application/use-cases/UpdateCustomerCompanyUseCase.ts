/**
 * Update Customer Company Use Case
 * Clean Architecture - Application Layer
 * Updates an existing customer company
 */

import { CustomerCompany } from '../../domain/entities/CustomerCompany';
import { ICustomerCompanyRepository } from '../../domain/ports/ICustomerCompanyRepository';

export interface UpdateCustomerCompanyRequest {
  id: string;
  tenantId: string;
  name?: string;
  displayName?: string;
  description?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
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
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  contractType?: 'monthly' | 'yearly' | 'custom';
  maxUsers?: number;
  maxTickets?: number;
  status?: 'active' | 'inactive' | 'suspended' | 'trial';
  isActive?: boolean;
  updatedBy: string;
}

export interface UpdateCustomerCompanyResponse {
  company: CustomerCompany;
}

export class UpdateCustomerCompanyUseCase {
  constructor(
    private readonly customerCompanyRepository: ICustomerCompanyRepository
  ) {}

  async execute(request: UpdateCustomerCompanyRequest): Promise<UpdateCustomerCompanyResponse> {
    // Find existing company
    const existingCompany = await this.customerCompanyRepository.findById(
      request.id,
      request.tenantId
    );

    if (!existingCompany) {
      throw new Error(`Company with ID "${request.id}" not found`);
    }

    // Check if name is being changed and doesn't conflict
    if (request.name && request.name !== existingCompany.getName()) {
      const companyWithSameName = await this.customerCompanyRepository.findByName(
        request.name,
        request.tenantId
      );

      if (companyWithSameName && companyWithSameName.getId() !== request.id) {
        throw new Error(`Company with name "${request.name}" already exists in this tenant`);
      }
    }

    // Apply updates through domain entity methods
    let updatedCompany = existingCompany;

    // Update basic info if provided
    if (request.name !== undefined || 
        request.displayName !== undefined || 
        request.description !== undefined ||
        request.industry !== undefined ||
        request.size !== undefined) {
      updatedCompany = updatedCompany.updateBasicInfo({
        name: request.name,
        displayName: request.displayName,
        description: request.description,
        industry: request.industry,
        size: request.size,
        updatedBy: request.updatedBy,
      });
    }

    // Update contact info if provided
    if (request.email !== undefined ||
        request.phone !== undefined ||
        request.website !== undefined ||
        request.address !== undefined) {
      updatedCompany = updatedCompany.updateContactInfo({
        email: request.email,
        phone: request.phone,
        website: request.website,
        address: request.address,
        updatedBy: request.updatedBy,
      });
    }

    // Update subscription if provided
    if (request.subscriptionTier !== undefined ||
        request.contractType !== undefined ||
        request.maxUsers !== undefined ||
        request.maxTickets !== undefined) {
      updatedCompany = updatedCompany.updateSubscription({
        subscriptionTier: request.subscriptionTier,
        contractType: request.contractType,
        maxUsers: request.maxUsers,
        maxTickets: request.maxTickets,
        updatedBy: request.updatedBy,
      });
    }

    // Update status if provided
    if (request.status !== undefined || request.isActive !== undefined) {
      updatedCompany = updatedCompany.updateStatus({
        status: request.status,
        isActive: request.isActive,
        updatedBy: request.updatedBy,
      });
    }

    // Save updated company
    const savedCompany = await this.customerCompanyRepository.save(updatedCompany);

    return {
      company: savedCompany,
    };
  }
}