
import { AuthApplicationService } from '../services/AuthApplicationService';

export class AuthControllerClean {
  constructor(private authService: AuthApplicationService) {}

  async login(loginData: any) {
    return this.authService.login(loginData);
  }

  async register(registerData: any) {
    return this.authService.register(registerData);
  }
}
