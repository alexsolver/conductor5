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

// Clean architecture - application service orchestrates use cases


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
      const result = await this.getCustomersUseCase.execute({ tenantId, limit, offset });

      return {
        success: true,
        customers: result.customers || [],
        total: result.total || 0,
        page,
        limit,
        totalPages: Math.ceil((result.total || 0) / limit)
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