/**
 * APPLICATION LAYER - DELETE CUSTOMER USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';

export class DeleteCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository
  ) {}

  async execute(customerId: string, deletedById?: string): Promise<void> {
    // Validation
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Find existing customer
    const existingCustomer = await this.customerRepository.findById(customerId);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Check if customer is already deleted
    if (!existingCustomer.isActive) {
      throw new Error('Customer is already deleted');
    }

    // Apply business rules for deletion
    await this.validateDeletionRules(existingCustomer);

    // Soft delete - mark as inactive
    await this.customerRepository.delete(customerId);
  }

  async deleteByTenantScope(customerId: string, tenantId: string, deletedById?: string): Promise<void> {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Find customer within tenant scope
    const existingCustomer = await this.customerRepository.findByIdAndTenant(customerId, tenantId);
    if (!existingCustomer) {
      throw new Error('Customer not found in tenant');
    }

    if (!existingCustomer.isActive) {
      throw new Error('Customer is already deleted');
    }

    // Apply business rules for deletion
    await this.validateDeletionRules(existingCustomer);

    // Soft delete
    await this.customerRepository.delete(customerId);
  }

  private async validateDeletionRules(customer: any): Promise<void> {
    // Business rule: Cannot delete customers with active tickets
    // This would require integration with tickets module
    // For now, we'll skip this validation but keep the structure

    // Business rule: Log deletion for audit purposes
    // This would integrate with audit system

    // Business rule: Check if customer has dependent records
    // This could include contracts, orders, etc.

    // For now, allow deletion as it's a soft delete
    return Promise.resolve();
  }
}