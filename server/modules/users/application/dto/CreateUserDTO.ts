/**
 * APPLICATION LAYER - USER DTOs
 * Seguindo Clean Architecture - 1qa.md compliance
 */

export interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'saas_admin' | 'tenant_admin' | 'agent' | 'customer';
  employmentType: 'clt' | 'autonomous';
  tenantId: string;
  
  // Optional profile information
  phoneNumber?: string;
  position?: string;
  department?: string;
  avatar?: string;
  
  // Optional preferences
  language?: string;
  timezone?: string;
  theme?: string;
  
  // Audit
  createdById?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  role?: 'saas_admin' | 'tenant_admin' | 'agent' | 'customer';
  employmentType?: 'clt' | 'autonomous';
  isActive?: boolean;
  
  // Profile information
  phoneNumber?: string;
  position?: string;
  department?: string;
  avatar?: string;
  
  // Preferences
  language?: string;
  timezone?: string;
  theme?: string;
  
  // Audit
  updatedById?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordDTO {
  email: string;
  tenantId?: string;
}

export interface UserFiltersDTO {
  role?: string[];
  employmentType?: string[];
  isActive?: boolean;
  department?: string;
  search?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  employmentType: string;
  isActive: boolean;
  
  // Profile information
  phoneNumber?: string;
  position?: string;
  department?: string;
  avatar?: string;
  
  // Preferences
  language: string;
  timezone: string;
  theme?: string;
  
  // Statistics
  lastLoginAt?: string;
  loginCount: number;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  
  // Computed fields
  permissions?: {
    canCreateTickets: boolean;
    canAssignTickets: boolean;
    canViewAllTickets: boolean;
    canDeleteTickets: boolean;
    canManageUsers: boolean;
    canManageTeams: boolean;
    canViewReports: boolean;
    canManageSystem: boolean;
  };
}

export interface UserProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  employmentType: string;
  phoneNumber?: string;
  position?: string;
  department?: string;
  avatar?: string;
  language: string;
  timezone: string;
  theme?: string;
  lastLoginAt?: string;
  permissions: {
    canCreateTickets: boolean;
    canAssignTickets: boolean;
    canViewAllTickets: boolean;
    canDeleteTickets: boolean;
    canManageUsers: boolean;
    canManageTeams: boolean;
    canViewReports: boolean;
    canManageSystem: boolean;
  };
}

export interface BulkUpdateUsersDTO {
  userIds: string[];
  updates: UpdateUserDTO;
}

export interface UserStatsDTO {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  byEmploymentType: Record<string, number>;
  byDepartment: Record<string, number>;
  recentLogins: number;
  newUsersThisMonth: number;
  averageLoginCount: number;
}

export interface TeamMemberDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  position?: string;
  department?: string;
  avatar?: string;
  isActive: boolean;
}