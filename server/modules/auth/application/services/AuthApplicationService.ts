
import { LoginUseCase } from '../use-cases/LoginUseCase';

export class AuthApplicationService {
  constructor(
    private readonly loginUseCase: LoginUseCase
  ) {}

  async authenticateUser(email: string, password: string) {
    return await this.loginUseCase.execute({ email, password });
  }
}
