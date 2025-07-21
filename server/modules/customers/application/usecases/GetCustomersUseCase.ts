/**
 * Get Customers Use Case
 * Clean Architecture - Application Layer
 */

import { Customer } from '../../domain/entities/Customer''[,;]
import { ICustomerRepository, CustomerFilter } from '../../domain/ports/ICustomerRepository''[,;]

export interface GetCustomersInput {
  tenantId: string;
  search?: string;
  active?: boolean;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetCustomersOutput {
  customers: Customer[];
  total: number;
  success: boolean;
  error?: string;
}

export class GetCustomersUseCase {
  constructor(
    private customerRepository: ICustomerRepository
  ) {}

  async execute(input: GetCustomersInput): Promise<GetCustomersOutput> {
    try {
      const filter: CustomerFilter = {
        tenantId: input.tenantId,
        search: input.search,
        active: input.active,
        verified: input.verified,
        limit: input.limit || 50,
        offset: input.offset || 0
      };

      const [customers, total] = await Promise.all([
        this.customerRepository.findMany(filter),
        this.customerRepository.count({
          tenantId: filter.tenantId,
          search: filter.search,
          active: filter.active,
          verified: filter.verified
        })
      ]);

      return {
        customers,
        total,
        success: true
      };
    } catch (error) {
      return {
        customers: [],
        total: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}