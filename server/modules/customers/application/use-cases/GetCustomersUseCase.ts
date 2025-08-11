/**
 * GetCustomersUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for customer management
 */

import { Customer } from '../../domain/entities/Customer';

interface CustomerRepositoryInterface {
  findByTenant(tenantId: string, filters?: any): Promise<Customer[]>;
}

export interface GetCustomersRequest {
  tenantId: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GetCustomersResponse {
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    isActive: boolean;
  }>;
  total: number;
  pagination: {
    limit?: number;
    offset?: number;
  };
}

export class GetCustomersUseCase {
  constructor(
    private readonly customerRepository: CustomerRepositoryInterface
  ) {}

  async execute(request: GetCustomersRequest): Promise<GetCustomersResponse> {
    const customers = await this.customerRepository.findByTenant(
      request.tenantId,
      {
        search: request.search,
        limit: request.limit,
        offset: request.offset
      }
    );

    return {
      customers: customers.map((c: Customer) => ({
        id: c.getId(),
        name: c.getName(),
        email: c.getEmail(),
        phone: c.getPhone(),
        address: c.getAddress(),
        isActive: c.isActive()
      })),
      total: customers.length,
      pagination: {
        limit: request.limit,
        offset: request.offset
      }
    };
  }
}