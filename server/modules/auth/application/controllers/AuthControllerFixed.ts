
import { LoginUseCase } from '../use-cases/LoginUseCase';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
}

export class AuthControllerFixed {
  constructor(
    private readonly loginUseCase: LoginUseCase
  ) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const result = await this.loginUseCase.execute({
        email: request.email,
        password: request.password
      });

      return {
        success: true,
        token: result.token,
        user: result.user
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
