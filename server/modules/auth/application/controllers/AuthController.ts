// Using generic HTTP types instead of Express-specific types
interface RequestData {
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
  tenantId?: string;
  userId?: string;
}

interface ResponseData {
  status: (code: number) => ResponseData;
  json: (data: any) => void;
}
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { sendSuccess, sendError } from '../../../../utils/standardResponse';

export class AuthController {
  constructor(private loginUseCase: LoginUseCase) {}

  async login(loginData: { email: string; password: string }): Promise<any> {
    try {
      const result = await this.loginUseCase.execute(loginData);
      return result;
    } catch (error) {
      throw error;
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