/**
 * Customer Application Service
 * Clean Architecture - Application Layer
 * Orchestrates multiple use cases and provides a clean API
 */

import { CreateCustomerUseCase, CreateCustomerInput, CreateCustomerOutput } from '../usecases/CreateCustomerUseCase';
import { GetCustomersUseCase, GetCustomersInput, GetCustomersOutput } from '../usecases/GetCustomersUseCase';
import { UpdateCustomerUseCase, UpdateCustomerInput, UpdateCustomerOutput } from '../usecases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase, DeleteCustomerInput, DeleteCustomerOutput } from '../usecases/DeleteCustomerUseCase';
// Assuming logError is imported from a logging utility
import { logError } from '../../../../utils/logger';

// Assuming CustomerRepository and its methods are defined elsewhere and injected
// For the sake of this example, we'll assume it has a countByTenant method
interface CustomerRepository {
  countByTenant(tenantId: string): Promise<number>;
}

// Placeholder for the actual CustomerRepository instance
let customerRepository: CustomerRepository;

// This is a placeholder and would typically be injected via a dependency injection container
export function setCustomerRepository(repo: CustomerRepository) {
  customerRepository = repo;
}


export class CustomerApplicationService {
  constructor(
    private createCustomerUseCase: CreateCustomerUseCase,
    private getCustomersUseCase: GetCustomersUseCase,
    private updateCustomerUseCase: UpdateCustomerUseCase,
    private deleteCustomerUseCase: DeleteCustomerUseCase
  ) {}

  async createCustomer(input: CreateCustomerInput): Promise<CreateCustomerOutput> {
    return await this.createCustomerUseCase.execute(input);
  }

  async getCustomers({ tenantId, page = 1, limit = 50 }: { tenantId: string; page?: number; limit?: number }) {
    try {
      const offset = (page - 1) * limit;
      const customers = await this.getCustomersUseCase.execute({ tenantId, limit, offset });
      // Ensure customerRepository is available before calling its methods
      if (!customerRepository) {
        throw new Error("CustomerRepository not initialized");
      }
      const total = await customerRepository.countByTenant(tenantId);

      return {
        success: true,
        customers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logError('Error in getCustomers', error, { tenantId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers'
      };
    }
  }

  async updateCustomer(data: any) {
    try {
      const customer = await this.updateCustomerUseCase.execute(data);
      return {
        success: true,
        customer
      };
    } catch (error) {
      logError('Error in updateCustomer', error, { customerId: data.id });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer'
      };
    }
  }

  async deleteCustomer(data: { id: string; tenantId: string }) {
    try {
      await this.deleteCustomerUseCase.execute(data);
      return {
        success: true
      };
    } catch (error) {
      logError('Error in deleteCustomer', error, { customerId: data.id });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete customer'
      };
    }
  }
}