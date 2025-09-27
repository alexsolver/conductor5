/**
 * APPLICATION LAYER - USER CONTROLLER
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Request, Response } from 'express';
import { CreateUserUseCase } from '../use-cases/CreateUserUseCase';
import { UpdateUserUseCase } from '../use-cases/UpdateUserUseCase';
import { FindUserUseCase } from '../use-cases/FindUserUseCase';
import { DeleteUserUseCase } from '../use-cases/DeleteUserUseCase';
import { UserDomainService } from '../../domain/entities/User';
import { CreateUserDTO, UpdateUserDTO, UserFiltersDTO, ChangePasswordDTO } from '../dto/CreateUserDTO';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private findUserUseCase: FindUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private userDomainService: UserDomainService
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateUserDTO = req.body;
      const currentUserId = req.user?.id;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      // Set audit fields
      dto.tenantId = tenantId;
      dto.createdById = currentUserId;

      const user = await this.createUserUseCase.execute(dto);

      // Convert to response format (without sensitive data)
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: this.userDomainService.createFullName(user.firstName, user.lastName),
        role: user.role,
        employmentType: user.employmentType,
        isActive: user.isActive,
        phoneNumber: user.phoneNumber,
        position: user.position,
        department: user.department,
        avatar: user.avatar,
        language: user.language,
        timezone: user.timezone,
        theme: user.theme,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        permissions: this.userDomainService.getUserPermissions(user.role)
      };

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userResponse
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create user',
        error: error.message
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateUserDTO = req.body;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Set audit fields
      dto.updatedById = currentUserId;

      const user = await this.updateUserUseCase.execute(id, dto);

      // Convert to response format (without sensitive data)
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: this.userDomainService.createFullName(user.firstName, user.lastName),
        role: user.role,
        employmentType: user.employmentType,
        isActive: user.isActive,
        phoneNumber: user.phoneNumber,
        position: user.position,
        department: user.department,
        avatar: user.avatar,
        language: user.language,
        timezone: user.timezone,
        theme: user.theme,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        permissions: this.userDomainService.getUserPermissions(user.role)
      };

      res.json({
        success: true,
        message: 'User updated successfully',
        data: userResponse
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update user',
        error: error.message
      });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const requesterTenantId = req.user?.tenantId;

      const user = await this.findUserUseCase.findById(id, requesterTenantId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Convert to response format (without sensitive data)
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: this.userDomainService.createFullName(user.firstName, user.lastName),
        role: user.role,
        employmentType: user.employmentType,
        isActive: user.isActive,
        phoneNumber: user.phoneNumber,
        position: user.position,
        department: user.department,
        avatar: user.avatar,
        language: user.language,
        timezone: user.timezone,
        theme: user.theme,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        loginCount: user.loginCount,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        permissions: this.userDomainService.getUserPermissions(user.role)
      };

      res.json({
        success: true,
        data: userResponse
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find user',
        error: error.message
      });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      
      // Extract filters from query parameters
      const filters: any = {};
      const { 
        role, employmentType, isActive, department, search,
        dateFrom, dateTo,
        page = 1, limit = 50, sortBy = 'firstName', sortOrder = 'asc'
      } = req.query;

      // Build filters object
      if (role) filters.role = Array.isArray(role) ? role : [role];
      if (employmentType) filters.employmentType = Array.isArray(employmentType) ? employmentType : [employmentType];
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (department) filters.department = department;
      if (search) filters.search = search;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const pagination = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      // Determine tenant scope based on user role
      const searchTenantId = userRole === 'saas_admin' ? undefined : tenantId;

      const result = await this.findUserUseCase.findWithFilters(filters, pagination, searchTenantId);

      // Convert users to response format
      const usersResponse = result.users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: this.userDomainService.createFullName(user.firstName, user.lastName),
        fullName: this.userDomainService.createFullName(user.firstName, user.lastName),
        role: user.role,
        employmentType: user.employmentType,
        isActive: user.isActive,
        phoneNumber: user.phoneNumber,
        position: user.position,
        department: user.department,
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        loginCount: user.loginCount,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }));

      console.log('[UserController] Enviando resposta com', usersResponse.length, 'usuários');
      console.log('[UserController] Primeiros usuários:', usersResponse.slice(0, 3));
      
      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: usersResponse,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: pagination.limit
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users',
        error: error.message
      });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const { q: searchTerm, page = 1, limit = 50 } = req.query;
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }

      const pagination = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        sortBy: 'firstName',
        sortOrder: 'asc' as const
      };

      // Determine tenant scope based on user role
      const searchTenantId = userRole === 'saas_admin' ? undefined : tenantId;

      const result = await this.findUserUseCase.searchUsers(
        searchTerm as string,
        searchTenantId,
        pagination
      );

      // Convert users to response format
      const usersResponse = result.users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: this.userDomainService.createFullName(user.firstName, user.lastName),
        role: user.role,
        employmentType: user.employmentType,
        isActive: user.isActive,
        position: user.position,
        department: user.department
      }));

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: usersResponse,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: pagination.limit
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Search failed',
        error: error.message
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const requesterTenantId = req.user?.tenantId;

      const profile = await this.findUserUseCase.getUserProfile(id, requesterTenantId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          ...profile,
          permissions: this.userDomainService.getUserPermissions(profile.role)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user profile',
        error: error.message
      });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      // Determine tenant scope based on user role
      const searchTenantId = userRole === 'saas_admin' ? undefined : tenantId;

      const stats = await this.findUserUseCase.getStatistics(searchTenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get statistics',
        error: error.message
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: ChangePasswordDTO = req.body;
      const currentUserId = req.user?.id;

      // Users can only change their own password unless they are admins
      if (currentUserId !== id) {
        const hasPermission = await this.findUserUseCase.validateUserAccess(
          id, 
          currentUserId!, 
          req.user?.tenantId
        );
        
        if (!hasPermission) {
          res.status(403).json({
            success: false,
            message: 'Insufficient permissions to change this user password'
          });
          return;
        }
      }

      await this.updateUserUseCase.changePassword(id, dto);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to change password',
        error: error.message
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await this.deleteUserUseCase.execute(id, currentUserId);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete user',
        error: error.message
      });
    }
  }

  async findByRole(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      // Determine tenant scope based on user role
      const searchTenantId = userRole === 'saas_admin' ? undefined : tenantId;

      const users = await this.findUserUseCase.findByRole(role, searchTenantId);

      const usersResponse = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: this.userDomainService.createFullName(user.firstName, user.lastName),
        role: user.role,
        position: user.position,
        department: user.department,
        isActive: user.isActive
      }));

      res.json({
        success: true,
        data: usersResponse
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find users by role',
        error: error.message
      });
    }
  }
}