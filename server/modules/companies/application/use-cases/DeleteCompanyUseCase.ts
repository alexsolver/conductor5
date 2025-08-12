/**
 * APPLICATION LAYER - DELETE COMPANY USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Company, CompanyDomainService } from '../../domain/entities/Company';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';

export class DeleteCompanyUseCase {
  constructor(
    private companyRepository: ICompanyRepository,
    private companyDomainService: CompanyDomainService
  ) {}

  async execute(companyId: string, deletedById?: string): Promise<void> {
    // Validation
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Find existing company
    const existingCompany = await this.companyRepository.findById(companyId);
    if (!existingCompany) {
      throw new Error('Company not found');
    }

    // Check if company is already deleted
    if (!existingCompany.isActive) {
      throw new Error('Company is already deleted');
    }

    // Apply business rules for deletion
    await this.validateDeletionRules(existingCompany);

    // Soft delete - mark as inactive
    await this.companyRepository.delete(companyId);
  }

  async deleteByTenantScope(companyId: string, tenantId: string, deletedById?: string): Promise<void> {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Find company within tenant scope
    const existingCompany = await this.companyRepository.findByIdAndTenant(companyId, tenantId);
    if (!existingCompany) {
      throw new Error('Company not found in your organization');
    }

    if (!existingCompany.isActive) {
      throw new Error('Company is already deleted');
    }

    // Apply business rules for deletion
    await this.validateDeletionRules(existingCompany);

    // Soft delete
    await this.companyRepository.delete(companyId);
  }

  async bulkDelete(companyIds: string[], tenantId?: string, deletedById?: string): Promise<void> {
    if (!companyIds || companyIds.length === 0) {
      throw new Error('Company IDs are required');
    }

    // Validate all companies before deletion
    for (const companyId of companyIds) {
      let company: Company | null;
      
      if (tenantId) {
        company = await this.companyRepository.findByIdAndTenant(companyId, tenantId);
        if (!company) {
          throw new Error(`Company ${companyId} not found in your organization`);
        }
      } else {
        company = await this.companyRepository.findById(companyId);
        if (!company) {
          throw new Error(`Company ${companyId} not found`);
        }
      }

      if (!company.isActive) {
        throw new Error(`Company ${companyId} is already deleted`);
      }

      // Apply business rules for deletion
      await this.validateDeletionRules(company);
    }

    // Delete all companies
    for (const companyId of companyIds) {
      await this.companyRepository.delete(companyId);
    }
  }

  async canDelete(companyId: string, tenantId?: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      let company: Company | null;
      
      if (tenantId) {
        company = await this.companyRepository.findByIdAndTenant(companyId, tenantId);
      } else {
        company = await this.companyRepository.findById(companyId);
      }

      if (!company) {
        return { canDelete: false, reason: 'Company not found' };
      }

      if (!company.isActive) {
        return { canDelete: false, reason: 'Company is already deleted' };
      }

      // Use domain service to check deletion rules
      const domainCheck = this.companyDomainService.canDeleteCompany(company);
      if (!domainCheck.canDelete) {
        return domainCheck;
      }

      // Check additional business rules
      await this.validateDeletionRules(company);
      
      return { canDelete: true };
    } catch (error) {
      return { 
        canDelete: false, 
        reason: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async softDelete(companyId: string, tenantId?: string): Promise<void> {
    // This is the same as regular delete since we use soft delete by default
    if (tenantId) {
      await this.deleteByTenantScope(companyId, tenantId);
    } else {
      await this.execute(companyId);
    }
  }

  async restore(companyId: string, tenantId?: string, restoredById?: string): Promise<Company> {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    let company: Company | null;
    
    if (tenantId) {
      // For restore, we need to search including inactive companies
      const allCompanies = await this.companyRepository.findWithFilters(
        { isActive: false }, 
        { page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' },
        tenantId
      );
      company = allCompanies.companies.find(c => c.id === companyId) || null;
    } else {
      company = await this.companyRepository.findById(companyId);
    }

    if (!company) {
      throw new Error('Company not found');
    }

    if (company.isActive) {
      throw new Error('Company is not deleted and cannot be restored');
    }

    // Restore company
    const restoredCompany = await this.companyRepository.update(companyId, { 
      isActive: true,
      status: 'active'
    });

    return restoredCompany;
  }

  private async validateDeletionRules(company: Company): Promise<void> {
    // Use domain service for basic deletion validation
    const domainCheck = this.companyDomainService.canDeleteCompany(company);
    if (!domainCheck.canDelete) {
      throw new Error(domainCheck.reason || 'Company cannot be deleted');
    }

    // Business rule: Check for active customers
    const customerCount = await this.companyRepository.getCompanyCustomerCount(
      company.id, 
      company.tenantId
    );
    if (customerCount > 0) {
      throw new Error(`Cannot delete company with ${customerCount} active customers. Remove customers first.`);
    }

    // Business rule: Check for active tickets
    const ticketCount = await this.companyRepository.getCompanyTicketCount(
      company.id, 
      company.tenantId
    );
    if (ticketCount > 0) {
      throw new Error(`Cannot delete company with ${ticketCount} active tickets. Close tickets first.`);
    }

    // Business rule: Cannot delete if company has active subscription
    if (company.subscriptionTier && ['premium', 'enterprise'].includes(company.subscriptionTier)) {
      if (company.status === 'active') {
        throw new Error('Cannot delete company with active premium subscription. Downgrade subscription first.');
      }
    }

    // Business rule: Log deletion attempt for audit
    console.log(`[DELETE-COMPANY] Attempting to delete company: ${company.name} (${company.id})`);
  }
}