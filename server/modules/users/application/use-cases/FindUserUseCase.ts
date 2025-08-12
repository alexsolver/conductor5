/**
 * APPLICATION LAYER - FIND USER USE CASE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { User, UserProfile } from '../../domain/entities/User';
import { UserDomainService } from '../../domain/entities/User';
import { IUserRepository, UserFilters, PaginationOptions, UserListResult } from '../../domain/repositories/IUserRepository';

export class FindUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private userDomainService: UserDomainService
  ) {}

  async findById(userId: string, requesterTenantId?: string): Promise<User | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    let user: User | null;

    if (requesterTenantId) {
      user = await this.userRepository.findByIdAndTenant(userId, requesterTenantId);
    } else {
      user = await this.userRepository.findById(userId);
    }

    return user;
  }

  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    if (!email) {
      throw new Error('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (tenantId) {
      return await this.userRepository.findByEmailAndTenant(normalizedEmail, tenantId);
    } else {
      return await this.userRepository.findByEmail(normalizedEmail);
    }
  }

  async findWithFilters(
    filters: UserFilters,
    pagination: PaginationOptions,
    tenantId?: string
  ): Promise<UserListResult> {
    // Validar paginação
    if (pagination.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (pagination.limit < 1 || pagination.limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }

    // Aplicar filtros padrão
    const normalizedFilters: UserFilters = {
      ...filters,
      // Por padrão, mostrar apenas usuários ativos se não especificado
      isActive: filters.isActive !== undefined ? filters.isActive : true
    };

    return await this.userRepository.findByFilters(normalizedFilters, pagination, tenantId);
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.userRepository.findByTenant(tenantId);
  }

  async findByRole(role: string, tenantId?: string): Promise<User[]> {
    if (!role) {
      throw new Error('Role is required');
    }

    const validRoles = ['saas_admin', 'tenant_admin', 'agent', 'customer'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    return await this.userRepository.findByRole(role, tenantId);
  }

  async searchUsers(
    searchTerm: string,
    tenantId?: string,
    pagination?: PaginationOptions
  ): Promise<UserListResult> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    // Limpar e normalizar termo de busca
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (normalizedSearchTerm.length < 2) {
      throw new Error('Search term must have at least 2 characters');
    }

    const defaultPagination: PaginationOptions = {
      page: 1,
      limit: 50,
      sortBy: 'firstName',
      sortOrder: 'asc'
    };

    return await this.userRepository.searchUsers(
      normalizedSearchTerm,
      tenantId,
      pagination || defaultPagination
    );
  }

  async getUserProfile(userId: string, tenantId?: string): Promise<UserProfile | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = tenantId 
      ? await this.userRepository.findByIdAndTenant(userId, tenantId)
      : await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    return this.userDomainService.createUserProfile(user);
  }

  async getStatistics(tenantId?: string) {
    const baseStats = await this.userRepository.getStatistics(tenantId);
    
    // Enriquecer estatísticas com dados calculados
    const totalUsers = baseStats.total;
    const averageLoginCount = totalUsers > 0 ? 
      Object.values(baseStats.byRole).reduce((sum, count) => sum + count, 0) / totalUsers : 0;

    return {
      ...baseStats,
      averageLoginCount: Math.round(averageLoginCount * 100) / 100,
      activePercentage: totalUsers > 0 ? Math.round((baseStats.active / totalUsers) * 100) : 0,
      inactivePercentage: totalUsers > 0 ? Math.round((baseStats.inactive / totalUsers) * 100) : 0
    };
  }

  async findTenantAdmins(tenantId: string): Promise<User[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.userRepository.findTenantAdmins(tenantId);
  }

  async findSaasAdmins(): Promise<User[]> {
    return await this.userRepository.findSaasAdmins();
  }

  async findByDepartment(department: string, tenantId: string): Promise<User[]> {
    if (!department) {
      throw new Error('Department is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await this.userRepository.findByDepartment(department, tenantId);
  }

  async findByEmploymentType(employmentType: string, tenantId: string): Promise<User[]> {
    if (!employmentType) {
      throw new Error('Employment type is required');
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const validEmploymentTypes = ['clt', 'autonomous'];
    if (!validEmploymentTypes.includes(employmentType)) {
      throw new Error('Invalid employment type');
    }

    return await this.userRepository.findByEmploymentType(employmentType, tenantId);
  }

  async validateUserAccess(userId: string, requesterUserId: string, targetTenantId?: string): Promise<boolean> {
    // Buscar o usuário requisitante
    const requester = await this.userRepository.findById(requesterUserId);
    if (!requester) {
      return false;
    }

    // SaaS admins podem acessar qualquer usuário
    if (requester.role === 'saas_admin') {
      return true;
    }

    // Para outros roles, buscar o usuário alvo
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      return false;
    }

    // Tenant admins podem acessar usuários do mesmo tenant
    if (requester.role === 'tenant_admin' && requester.tenantId === targetUser.tenantId) {
      return true;
    }

    // Usuários podem acessar apenas seus próprios dados
    return requester.id === targetUser.id;
  }
}