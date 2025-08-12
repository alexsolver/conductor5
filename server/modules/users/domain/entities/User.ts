/**
 * DOMAIN LAYER - USER ENTITY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'saas_admin' | 'tenant_admin' | 'agent' | 'customer';
  employmentType: 'clt' | 'autonomous';
  isActive: boolean;
  
  // Profile information
  phoneNumber?: string;
  position?: string;
  department?: string;
  avatar?: string;
  
  // Authentication
  passwordHash: string;
  lastLoginAt?: Date;
  loginCount: number;
  
  // Preferences
  language: string;
  timezone: string;
  theme?: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
}

export interface UserProfile {
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
  lastLoginAt?: Date;
}

export interface UserPermissions {
  canCreateTickets: boolean;
  canAssignTickets: boolean;
  canViewAllTickets: boolean;
  canDeleteTickets: boolean;
  canManageUsers: boolean;
  canManageTeams: boolean;
  canViewReports: boolean;
  canManageSystem: boolean;
}

export class UserDomainService {
  /**
   * Validates user business rules
   */
  validate(user: Partial<User>): boolean {
    // Regra de negócio: Email obrigatório e válido
    if (!user.email || !this.isValidEmail(user.email)) {
      throw new Error('Valid email is required');
    }
    
    // Regra de negócio: Primeiro nome obrigatório
    if (!user.firstName || user.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    
    // Regra de negócio: Último nome obrigatório
    if (!user.lastName || user.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }
    
    // Regra de negócio: Role válido
    const validRoles = ['saas_admin', 'tenant_admin', 'agent', 'customer'];
    if (user.role && !validRoles.includes(user.role)) {
      throw new Error('Invalid user role');
    }
    
    // Regra de negócio: Employment type válido
    const validEmploymentTypes = ['clt', 'autonomous'];
    if (user.employmentType && !validEmploymentTypes.includes(user.employmentType)) {
      throw new Error('Invalid employment type');
    }
    
    return true;
  }
  
  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Creates full name from first and last name
   */
  createFullName(firstName: string, lastName: string): string {
    return `${firstName.trim()} ${lastName.trim()}`;
  }
  
  /**
   * Determines user permissions based on role
   */
  getUserPermissions(role: string): UserPermissions {
    switch (role) {
      case 'saas_admin':
        return {
          canCreateTickets: true,
          canAssignTickets: true,
          canViewAllTickets: true,
          canDeleteTickets: true,
          canManageUsers: true,
          canManageTeams: true,
          canViewReports: true,
          canManageSystem: true
        };
        
      case 'tenant_admin':
        return {
          canCreateTickets: true,
          canAssignTickets: true,
          canViewAllTickets: true,
          canDeleteTickets: true,
          canManageUsers: true,
          canManageTeams: true,
          canViewReports: true,
          canManageSystem: false
        };
        
      case 'agent':
        return {
          canCreateTickets: true,
          canAssignTickets: true,
          canViewAllTickets: true,
          canDeleteTickets: false,
          canManageUsers: false,
          canManageTeams: false,
          canViewReports: true,
          canManageSystem: false
        };
        
      case 'customer':
        return {
          canCreateTickets: true,
          canAssignTickets: false,
          canViewAllTickets: false,
          canDeleteTickets: false,
          canManageUsers: false,
          canManageTeams: false,
          canViewReports: false,
          canManageSystem: false
        };
        
      default:
        return {
          canCreateTickets: false,
          canAssignTickets: false,
          canViewAllTickets: false,
          canDeleteTickets: false,
          canManageUsers: false,
          canManageTeams: false,
          canViewReports: false,
          canManageSystem: false
        };
    }
  }
  
  /**
   * Validates password requirements
   */
  validatePassword(password: string): boolean {
    // Regra de negócio: Password deve ter pelo menos 8 caracteres
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Regra de negócio: Password deve ter pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    // Regra de negócio: Password deve ter pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    // Regra de negócio: Password deve ter pelo menos um número
    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    
    return true;
  }
  
  /**
   * Creates user profile from user entity
   */
  createUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: this.createFullName(user.firstName, user.lastName),
      role: user.role,
      employmentType: user.employmentType,
      phoneNumber: user.phoneNumber,
      position: user.position,
      department: user.department,
      avatar: user.avatar,
      language: user.language,
      timezone: user.timezone,
      theme: user.theme,
      lastLoginAt: user.lastLoginAt
    };
  }
  
  /**
   * Checks if user can access tenant
   */
  canAccessTenant(user: User, targetTenantId: string): boolean {
    // SaaS admins can access any tenant
    if (user.role === 'saas_admin') {
      return true;
    }
    
    // Other users can only access their own tenant
    return user.tenantId === targetTenantId;
  }
  
  /**
   * Updates login statistics
   */
  updateLoginStats(user: User): Partial<User> {
    return {
      lastLoginAt: new Date(),
      loginCount: (user.loginCount || 0) + 1
    };
  }
}