/**
 * GetUsersUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for user management business logic
 */

import { User } from '../../../auth/domain/entities/User';

interface UserRepositoryInterface {
  findByTenant(tenantId: string, filters?: any): Promise<User[]>;
}

export interface GetUsersRequest {
  tenantId: string;
  search?: string;
  role?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetUsersResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
  }>;
  total: number;
  pagination: {
    limit?: number;
    offset?: number;
  };
}

export class GetUsersUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface
  ) {}

  async execute(request: GetUsersRequest): Promise<GetUsersResponse> {
    const users = await this.userRepository.findByTenant(
      request.tenantId,
      {
        search: request.search,
        role: request.role,
        active: request.active,
        limit: request.limit,
        offset: request.offset
      }
    );

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users.map((u: User) => ({
        id: u.getId(),
        email: u.getEmail(),
        firstName: u.getFirstName(),
        lastName: u.getLastName(),
        role: u.getRole(),
        isActive: u.isActive(),
        lastLoginAt: u.getLastLoginAt()
      })),
      total: users.length,
      pagination: {
        limit: request.limit,
        offset: request.offset
      }
    };
  }
}