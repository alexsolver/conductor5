/**
 * AuthenticateUserUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for authentication business logic
 */

import { User } from '../../domain/entities/User';
import { AuthToken } from '../../domain/entities/AuthToken';

interface UserRepositoryInterface {
  findByEmail(email: string): Promise<User | null>;
}

interface TokenServiceInterface {
  generateTokens(user: User): Promise<AuthToken>;
  validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}

export interface AuthenticateUserRequest {
  email: string;
  password: string;
}

export interface AuthenticateUserResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      tenantId: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly tokenService: TokenServiceInterface
  ) {}

  async execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Validate password
    const isPasswordValid = await this.tokenService.validatePassword(
      request.password,
      user.getPasswordHash()
    );

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Check if user is active
    if (!user.isActive()) {
      return {
        success: false,
        message: 'User account is disabled'
      };
    }

    // Generate tokens
    const authToken = await this.tokenService.generateTokens(user);

    return {
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: user.getId(),
          email: user.getEmail(),
          tenantId: user.getTenantId(),
          role: user.getRole()
        },
        accessToken: authToken.getAccessToken(),
        refreshToken: authToken.getRefreshToken()
      }
    };
  }
}