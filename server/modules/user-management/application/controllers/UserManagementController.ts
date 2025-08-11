/**
 * UserManagementController - Clean Architecture Presentation Layer
 * Resolves violations: Missing controllers for user management
 */

import { Request, Response } from 'express';
import { GetUsersUseCase } from '../use-cases/GetUsersUseCase';
import { CreateUserUseCase } from '../use-cases/CreateUserUseCase';
import { UpdateUserUseCase } from '../use-cases/UpdateUserUseCase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class UserManagementController {
  constructor(
    private getUsersUseCase: GetUsersUseCase,
    private createUserUseCase: CreateUserUseCase,
    private updateUserUseCase: UpdateUserUseCase
  ) {}

  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const {
        search,
        role,
        active,
        limit,
        offset
      } = req.query;

      const result = await this.getUsersUseCase.execute({
        tenantId,
        search: search as string,
        role: role as string,
        active: active === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve users';
      res.status(500).json({ success: false, message });
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const {
        email,
        password,
        firstName,
        lastName,
        role
      } = req.body;

      const result = await this.createUserUseCase.execute({
        tenantId,
        email,
        password,
        firstName,
        lastName,
        role
      });

      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      res.status(500).json({ success: false, message });
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { userId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await this.updateUserUseCase.execute({
        tenantId,
        userId,
        ...req.body
      });

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      res.status(500).json({ success: false, message });
    }
  }
}