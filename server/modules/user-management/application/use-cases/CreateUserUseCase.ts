/**
 * CreateUserUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for user creation business logic
 */

import { User } from '../../../auth/domain/entities/User';

interface UserRepositoryInterface {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}

interface PasswordServiceInterface {
  hashPassword(password: string): Promise<string>;
}

export interface CreateUserRequest {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly passwordService: PasswordServiceInterface
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Validate required fields
    if (!request.email || !request.password || !request.firstName || !request.lastName) {
      return {
        success: false,
        message: 'Email, password, first name, and last name are required'
      };
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists'
      };
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(request.password);

    // Create domain entity
    const user = new User(
      generateId(),
      request.tenantId,
      request.email,
      passwordHash,
      request.role || 'agent',
      request.firstName,
      request.lastName,
      true // active by default
    );

    // Persist through repository
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'User created successfully',
      data: {
        id: user.getId(),
        email: user.getEmail(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        role: user.getRole()
      }
    };
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}