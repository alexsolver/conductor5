// Use Case - Application Logic
import { Customer } from "../../domain/entities/Customer";
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository";

export interface GetCustomersRequest {
  tenantId: string;
  page?: number;
  limit?: number;
}

export interface GetCustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
  error?: string;
}

export class GetCustomersUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository
  ) {}

  async execute(request: GetCustomersRequest): Promise<GetCustomersResponse> {
    try {
      const page = request.page || 1;
      const limit = request.limit || 50;
      const offset = (page - 1) * limit;

      // Get customers and total count
      const [customers, total] = await Promise.all([
        this.customerRepository.findByTenant(request.tenantId, limit, offset),
        this.customerRepository.countByTenant(request.tenantId)
      ]);

      return {
        customers,
        total,
        page,
        limit,
        success: true
      };

    } catch (error) {
      return {
        customers: [],
        total: 0,
        page: request.page || 1,
        limit: request.limit || 50,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}