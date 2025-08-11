/**
 * UpdateUserUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for user update business logic
 */

import { User } from '../../../auth/domain/entities/User';

interface UserRepositoryInterface {
  findById(id: string, tenantId: string): Promise<User | null>;
  update(user: User): Promise<void>;
}

export interface UpdateUserRequest {
  tenantId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  active?: boolean;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  };
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface
  ) {}

  async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    // Find existing user
    const user = await this.userRepository.findById(request.userId, request.tenantId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Update user properties using domain methods
    if (request.firstName || request.lastName || request.email) {
      user.updateProfile(
        request.firstName || user.getFirstName(),
        request.lastName || user.getLastName(),
        request.email || user.getEmail()
      );
    }

    if (request.role) {
      user.changeRole(request.role);
    }

    if (typeof request.active === 'boolean') {
      if (request.active) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    // Persist changes
    await this.userRepository.update(user);

    return {
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.getId(),
        email: user.getEmail(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        role: user.getRole(),
        isActive: user.isActive()
      }
    };
  }
}