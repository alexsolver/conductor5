
import { Request, Response } from 'express';
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { sendSuccess, sendError } from '../../../../utils/standardResponse';

export class AuthController {
  constructor(private loginUseCase: LoginUseCase) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const result = await this.loginUseCase.execute({ email, password });
      
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      sendError(res, error, 'Login failed', 401);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Logout logic here
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      sendError(res, error, 'Logout failed', 500);
    }
  }
}
