/**
 * DOMAIN LAYER - USER REPOSITORY INTERFACE
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { User } from '../entities/User';

export interface UserFilters {
  role?: string[];
  employmentType?: string[];
  isActive?: boolean;
  department?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResult {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;
  
  /**
   * Find user by ID within tenant scope
   */
  findByIdAndTenant(id: string, tenantId: string): Promise<User | null>;
  
  /**
   * Find user by email (global lookup for authentication)
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Find user by email for authentication (1qa.md compliant)
   */
  findByEmailForAuth(email: string): Promise<User | null>;
  
  /**
   * Find user by email within tenant scope
   */
  findByEmailAndTenant(email: string, tenantId: string): Promise<User | null>;
  
  /**
   * Create new user
   */
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  
  /**
   * Update existing user
   */
  update(id: string, updates: Partial<User>): Promise<User>;
  
  /**
   * Soft delete user (set isActive = false)
   */
  delete(id: string): Promise<void>;
  
  /**
   * Find users with filters and pagination
   */
  findByFilters(
    filters: UserFilters, 
    pagination: PaginationOptions, 
    tenantId?: string
  ): Promise<UserListResult>;
  
  /**
   * Find all users for a tenant
   */
  findByTenant(tenantId: string): Promise<User[]>;
  
  /**
   * Find users by role
   */
  findByRole(role: string, tenantId?: string): Promise<User[]>;
  
  /**
   * Find users by employment type
   */
  findByEmploymentType(employmentType: string, tenantId: string): Promise<User[]>;
  
  /**
   * Count users by filters
   */
  countByFilters(filters: UserFilters, tenantId?: string): Promise<number>;
  
  /**
   * Get user statistics
   */
  getStatistics(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byEmploymentType: Record<string, number>;
    recentLogins: number; // last 30 days
  }>;
  
  /**
   * Search users by text (name, email, position)
   */
  searchUsers(
    searchTerm: string, 
    tenantId?: string, 
    pagination?: PaginationOptions
  ): Promise<UserListResult>;
  
  /**
   * Update login statistics
   */
  updateLoginStats(id: string, stats: { lastLoginAt: Date; loginCount: number }): Promise<void>;
  
  /**
   * Find users by department
   */
  findByDepartment(department: string, tenantId: string): Promise<User[]>;
  
  /**
   * Bulk update users (for batch operations)
   */
  bulkUpdate(
    ids: string[], 
    updates: Partial<User>
  ): Promise<User[]>;
  
  /**
   * Check if email exists (for uniqueness validation)
   */
  emailExists(email: string, excludeId?: string): Promise<boolean>;
  
  /**
   * Find users that need notification (active users with email)
   */
  findUsersForNotification(tenantId: string): Promise<User[]>;
  
  /**
   * Find admins for a tenant
   */
  findTenantAdmins(tenantId: string): Promise<User[]>;
  
  /**
   * Find all SaaS admins
   */
  findSaasAdmins(): Promise<User[]>;
}