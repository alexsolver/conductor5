/**
 * Customer Application Service
 * Clean Architecture - Application Layer
 * Orchestrates multiple use cases and provides a clean API
 */

import { CreateCustomerUseCase, CreateCustomerInput, CreateCustomerOutput } from '../usecases/CreateCustomerUseCase';
import { GetCustomersUseCase, GetCustomersInput, GetCustomersOutput } from '../usecases/GetCustomersUseCase';
import { UpdateCustomerUseCase, UpdateCustomerInput, UpdateCustomerOutput } from '../usecases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase, DeleteCustomerInput, DeleteCustomerOutput } from '../usecases/DeleteCustomerUseCase';

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

  async getCustomers(input: GetCustomersInput): Promise<GetCustomersOutput> {
    return await this.getCustomersUseCase.execute(input);
  }

  async updateCustomer(input: UpdateCustomerInput): Promise<UpdateCustomerOutput> {
    return await this.updateCustomerUseCase.execute(input);
  }

  async deleteCustomer(input: DeleteCustomerInput): Promise<DeleteCustomerOutput> {
    return await this.deleteCustomerUseCase.execute(input);
  }
}