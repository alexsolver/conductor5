
// Using DTOs and interfaces instead of framework dependencies
import { BaseController } from './BaseController';

export class SharedController extends BaseController {
  async handleSharedRequest(req: Request, res: Response): Promise<void> {
    try {
      // Shared business logic here
      this.sendSuccess(res, { message: 'Shared operation completed' });
    } catch (error) {
      this.sendError(res, error as Error);
    }
  }
}
