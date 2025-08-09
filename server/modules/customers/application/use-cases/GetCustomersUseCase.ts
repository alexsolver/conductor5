// Application Layer - Use Case
import { Customer } from "../../domain/entities/Customer";
import { ICustomerRepository } from "../../domain/ports/ICustomerRepository";

export interface GetCustomersRequest {
  tenantId: string;
  limit?: number;
  offset?: number;
  verified?: boolean;
  active?: boolean;
  company?: string;
  tags?: string[];
}

export interface GetCustomersResponse {
  customers: Customer[];
  total: number;
  hasMore: boolean;
}

export class GetCustomersUseCase {
  constructor(private customerRepository: ICustomerRepository) {}

  async execute(request: GetCustomersRequest): Promise<GetCustomersResponse> {
    const limit = request.limit || 50;
    const offset = request.offset || 0;

    // Get customers with filters
    const customers = await this.customerRepository.findMany({
      tenantId: request.tenantId,
      limit: limit + 1, // Get one extra to check if there are more
      offset,
      verified: request.verified,
      active: request.active,
    });

    // Get total count
    const total = await this.customerRepository.count({
      tenantId: request.tenantId,
      verified: request.verified,
      active: request.active,
    });

    // Check if there are more results
    const hasMore = customers.length > limit;
    if (hasMore) {
      customers.pop(); // Remove the extra customer
    }

    return {
      customers,
      total,
      hasMore,
    };
  }
}