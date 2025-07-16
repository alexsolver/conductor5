// Register Use Case - Clean Architecture
import { User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { ITokenService } from "../../../domain/services/ITokenService";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'agent' | 'customer';
  tenantId?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    tenantId: string | null;
    profileImageUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export class RegisterUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService
  ) {}

  async execute(request: RegisterRequest): Promise<RegisterResponse> {
    const { email, password, firstName, lastName, role, tenantId } = request;

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(password);

    // Create user entity
    const user = User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: role || 'agent',
      tenantId
    });

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(savedUser);
    const refreshToken = this.tokenService.generateRefreshToken(savedUser);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        tenantId: savedUser.tenantId,
        profileImageUrl: savedUser.profileImageUrl,
      },
      accessToken,
      refreshToken
    };
  }
}