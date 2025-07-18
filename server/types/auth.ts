import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  role: string;
  email?: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Export for backward compatibility
export { AuthenticatedUser as User };