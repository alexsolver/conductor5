/**
 * Sistema de Roles e Permissões para Conductor
 * 
 * Hierarquia de Roles:
 * 1. saas_admin - Administrador da plataforma SaaS (acesso global)
 * 2. tenant_admin - Administrador do tenant (acesso completo ao tenant)
 * 3. agent - Agente de suporte (acesso limitado ao tenant)
 * 4. customer - Cliente (acesso restrito a seus próprios dados)
 */

export enum Role {
  SAAS_ADMIN = 'saas_admin',
  TENANT_ADMIN = 'tenant_admin', 
  AGENT = 'agent',
  CUSTOMER = 'customer'
}

export enum Permission {
  // Platform Management (SaaS Admin only)
  PLATFORM_MANAGE_TENANTS = 'platform:manage_tenants',
  PLATFORM_VIEW_ANALYTICS = 'platform:view_analytics',
  PLATFORM_MANAGE_USERS = 'platform:manage_users',
  PLATFORM_SYSTEM_CONFIG = 'platform:system_config',
  PLATFORM_MANAGE_INTEGRATIONS = 'platform:manage_integrations',
  PLATFORM_MANAGE_TRANSLATIONS = 'platform:manage_translations',
  
  // Tenant Management
  TENANT_MANAGE_SETTINGS = 'tenant:manage_settings',
  TENANT_MANAGE_USERS = 'tenant:manage_users',
  TENANT_VIEW_ANALYTICS = 'tenant:view_analytics',
  TENANT_MANAGE_BILLING = 'tenant:manage_billing',
  
  // Ticket Management
  TICKET_VIEW_ALL = 'ticket:view_all',
  TICKET_VIEW_ASSIGNED = 'ticket:view_assigned',
  TICKET_CREATE = 'ticket:create',
  TICKET_UPDATE = 'ticket:update',
  TICKET_DELETE = 'ticket:delete',
  TICKET_ASSIGN = 'ticket:assign',
  TICKET_CLOSE = 'ticket:close',
  
  // Customer Management
  CUSTOMER_VIEW_ALL = 'customer:view_all',
  CUSTOMER_VIEW_OWN = 'customer:view_own',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  

  
  // Reports and Analytics
  ANALYTICS_VIEW_TENANT = 'analytics:view_tenant',
  ANALYTICS_VIEW_TEAM = 'analytics:view_team',
  ANALYTICS_VIEW_OWN = 'analytics:view_own',
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SAAS_ADMIN]: [
    // Platform permissions (full access)
    Permission.PLATFORM_MANAGE_TENANTS,
    Permission.PLATFORM_VIEW_ANALYTICS,
    Permission.PLATFORM_MANAGE_USERS,
    Permission.PLATFORM_SYSTEM_CONFIG,
    Permission.PLATFORM_MANAGE_INTEGRATIONS,
    Permission.PLATFORM_MANAGE_TRANSLATIONS,
    
    // All tenant permissions (across all tenants)
    Permission.TENANT_MANAGE_SETTINGS,
    Permission.TENANT_MANAGE_USERS,
    Permission.TENANT_VIEW_ANALYTICS,
    Permission.TENANT_MANAGE_BILLING,
    
    // All ticket permissions
    Permission.TICKET_VIEW_ALL,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
    Permission.TICKET_DELETE,
    Permission.TICKET_ASSIGN,
    Permission.TICKET_CLOSE,
    
    // All customer permissions
    Permission.CUSTOMER_VIEW_ALL,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    

    
    // All analytics
    Permission.ANALYTICS_VIEW_TENANT,
    Permission.ANALYTICS_VIEW_TEAM,
    Permission.ANALYTICS_VIEW_OWN,
  ],

  [Role.TENANT_ADMIN]: [
    // Tenant management within their tenant
    Permission.TENANT_MANAGE_SETTINGS,
    Permission.TENANT_MANAGE_USERS,
    Permission.TENANT_VIEW_ANALYTICS,
    Permission.TENANT_MANAGE_BILLING,
    Permission.TENANT_MANAGE_INTEGRATIONS,
    
    // All ticket permissions within tenant
    Permission.TICKET_VIEW_ALL,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
    Permission.TICKET_DELETE,
    Permission.TICKET_ASSIGN,
    Permission.TICKET_CLOSE,
    
    // All customer permissions within tenant
    Permission.CUSTOMER_VIEW_ALL,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    

    
    // Tenant analytics
    Permission.ANALYTICS_VIEW_TENANT,
    Permission.ANALYTICS_VIEW_TEAM,
    Permission.ANALYTICS_VIEW_OWN,
  ],

  [Role.AGENT]: [
    // Basic ticket permissions
    Permission.TICKET_VIEW_ALL,
    Permission.TICKET_VIEW_ASSIGNED,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
    Permission.TICKET_ASSIGN,
    Permission.TICKET_CLOSE,
    
    // Customer view and basic update
    Permission.CUSTOMER_VIEW_ALL,
    Permission.CUSTOMER_UPDATE,
    

    
    // Own analytics
    Permission.ANALYTICS_VIEW_OWN,
  ],

  [Role.CUSTOMER]: [
    // Limited customer access
    Permission.CUSTOMER_VIEW_OWN,
    Permission.TICKET_VIEW_ASSIGNED, // Only their own tickets
    Permission.ANALYTICS_VIEW_OWN,
  ],
};

// Utility functions for permission checking
export class PermissionService {
  static hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
  }

  static hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  static hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  static getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  static canAccessTenant(userRole: Role, userTenantId: string | null, targetTenantId: string): boolean {
    // SaaS admins can access any tenant
    if (userRole === Role.SAAS_ADMIN) {
      return true;
    }
    
    // Other roles can only access their own tenant
    return userTenantId === targetTenantId;
  }

  static canManageUser(managerRole: Role, managerTenantId: string | null, targetUserRole: Role, targetTenantId: string | null): boolean {
    // SaaS admins can manage anyone
    if (managerRole === Role.SAAS_ADMIN) {
      return true;
    }
    
    // Tenant admins can manage users in their tenant (except other tenant admins and SaaS admins)
    if (managerRole === Role.TENANT_ADMIN) {
      return managerTenantId === targetTenantId && 
             targetUserRole !== Role.SAAS_ADMIN && 
             targetUserRole !== Role.TENANT_ADMIN;
    }
    
    return false;
  }
}

// Middleware types for enhanced authorization
export interface AuthorizedUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  permissions: Permission[];
}

export function enrichUserWithPermissions(user: { id: string; email: string; role: string; tenantId: string | null }): AuthorizedUser {
  const role = user.role as Role;
  const permissions = PermissionService.getPermissions(role);
  
  return {
    ...user,
    role,
    permissions
  };
}