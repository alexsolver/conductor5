// Login Use Case - Clean Architecture
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { ITokenService } from "../../../domain/services/ITokenService";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
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

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    const { email, password } = request;

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.passwordHasher.verify(password, user.getPasswordHash());
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login timestamp
    const updatedUser = user.recordLogin();
    await this.userRepository.update(updatedUser);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(updatedUser);
    const refreshToken = this.tokenService.generateRefreshToken(updatedUser);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        tenantId: updatedUser.tenantId,
        profileImageUrl: updatedUser.profileImageUrl,
      },
      accessToken,
      refreshToken
    };
  }
}