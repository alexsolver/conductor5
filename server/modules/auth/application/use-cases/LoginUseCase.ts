
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IPasswordService } from '../../domain/ports/IPasswordService';
import { AuthDomainService } from '../../domain/services/AuthDomainService';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  userId: string;
  token: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private passwordService: IPasswordService,
    private authDomainService: AuthDomainService
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const { email, password } = command;

    // Validate input
    if (!this.authDomainService.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Find user
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user can login
    if (!this.authDomainService.canLogin(user)) {
      throw new Error('User account is disabled or blocked');
    }

    // Verify password
    const isValidPassword = await this.passwordService.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens (simplified - would use actual JWT service)
    const token = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();

    return {
      userId: user.id,
      token,
      refreshToken
    };
  }
}
