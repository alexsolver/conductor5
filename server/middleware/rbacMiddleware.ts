import { Request, Response, NextFunction } from 'express';
import { storageSimple } from '../storage-simple';

// Enhanced RBAC/ABAC System with Tenant-specific permissions
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  name: string;
  permissions: Permission[];
  tenantId?: string;
}

export interface AuthorizedUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  permissions: Permission[];
  attributes: Record<string, any>;
}

export interface AuthorizedRequest extends Request {
  user?: AuthorizedUser;
  tenant?: any;
}

// Comprehensive permission definitions
export const PERMISSIONS = {
  // Platform-level permissions (SaaS Admin)
  PLATFORM: {
    MANAGE_TENANTS: { resource: 'platform', action: 'manage_tenants' },
    MANAGE_USERS: { resource: 'platform', action: 'manage_users' },
    VIEW_ANALYTICS: { resource: 'platform', action: 'view_analytics' },
    MANAGE_BILLING: { resource: 'platform', action: 'manage_billing' },
    MANAGE_SECURITY: { resource: 'platform', action: 'manage_security' },
  },
  
  // Tenant-level permissions
  TENANT: {
    MANAGE_SETTINGS: { resource: 'tenant', action: 'manage_settings' },
    MANAGE_USERS: { resource: 'tenant', action: 'manage_users' },
    VIEW_ANALYTICS: { resource: 'tenant', action: 'view_analytics' },
    MANAGE_BILLING: { resource: 'tenant', action: 'manage_billing' },
    CONFIGURE_INTEGRATIONS: { resource: 'tenant', action: 'configure_integrations' },
  },
  
  // Ticket permissions
  TICKET: {
    VIEW_ALL: { resource: 'ticket', action: 'view_all' },
    VIEW_ASSIGNED: { resource: 'ticket', action: 'view_assigned' },
    VIEW_OWN: { resource: 'ticket', action: 'view_own' },
    CREATE: { resource: 'ticket', action: 'create' },
    UPDATE: { resource: 'ticket', action: 'update' },
    DELETE: { resource: 'ticket', action: 'delete' },
    ASSIGN: { resource: 'ticket', action: 'assign' },
    RESOLVE: { resource: 'ticket', action: 'resolve' },
    REOPEN: { resource: 'ticket', action: 'reopen' },
  },
  
  // Customer permissions
  CUSTOMER: {
    VIEW_ALL: { resource: 'customer', action: 'view_all' },
    VIEW_OWN: { resource: 'customer', action: 'view_own' },
    CREATE: { resource: 'customer', action: 'create' },
    UPDATE: { resource: 'customer', action: 'update' },
    DELETE: { resource: 'customer', action: 'delete' },
    EXPORT: { resource: 'customer', action: 'export' },
  },
  

  
  // Analytics permissions
  ANALYTICS: {
    VIEW_BASIC: { resource: 'analytics', action: 'view_basic' },
    VIEW_DETAILED: { resource: 'analytics', action: 'view_detailed' },
    EXPORT: { resource: 'analytics', action: 'export' },
  },

  // GDPR Compliance permissions
  GDPR: {
    READ: { resource: 'gdpr', action: 'read' },
    CREATE: { resource: 'gdpr', action: 'create' },
    UPDATE: { resource: 'gdpr', action: 'update' },
    DELETE: { resource: 'gdpr', action: 'delete' },
    MANAGE_POLICIES: { resource: 'gdpr', action: 'manage_policies' },
    MANAGE_REQUESTS: { resource: 'gdpr', action: 'manage_requests' },
    EXPORT_DATA: { resource: 'gdpr', action: 'export_data' },
  },
};

// Role definitions with tenant-specific permissions
export const ROLE_PERMISSIONS = {
  saas_admin: [
    PERMISSIONS.PLATFORM.MANAGE_TENANTS,
    PERMISSIONS.PLATFORM.MANAGE_USERS,
    PERMISSIONS.PLATFORM.VIEW_ANALYTICS,
    PERMISSIONS.PLATFORM.MANAGE_BILLING,
    PERMISSIONS.PLATFORM.MANAGE_SECURITY,
    PERMISSIONS.TENANT.MANAGE_SETTINGS,
    PERMISSIONS.TENANT.MANAGE_USERS,
    PERMISSIONS.TENANT.VIEW_ANALYTICS,
    PERMISSIONS.TICKET.VIEW_ALL,
    PERMISSIONS.TICKET.CREATE,
    PERMISSIONS.TICKET.UPDATE,
    PERMISSIONS.TICKET.DELETE,
    PERMISSIONS.TICKET.ASSIGN,
    PERMISSIONS.TICKET.RESOLVE,
    PERMISSIONS.CUSTOMER.VIEW_ALL,
    PERMISSIONS.CUSTOMER.CREATE,
    PERMISSIONS.CUSTOMER.UPDATE,
    PERMISSIONS.CUSTOMER.DELETE,
    PERMISSIONS.CUSTOMER.EXPORT,
    PERMISSIONS.ANALYTICS.VIEW_DETAILED,
    PERMISSIONS.ANALYTICS.EXPORT,
    PERMISSIONS.GDPR.READ,
    PERMISSIONS.GDPR.CREATE,
    PERMISSIONS.GDPR.UPDATE,
    PERMISSIONS.GDPR.DELETE,
    PERMISSIONS.GDPR.MANAGE_POLICIES,
    PERMISSIONS.GDPR.MANAGE_REQUESTS,
    PERMISSIONS.GDPR.EXPORT_DATA,
  ],
  
  tenant_admin: [
    PERMISSIONS.TENANT.MANAGE_SETTINGS,
    PERMISSIONS.TENANT.MANAGE_USERS,
    PERMISSIONS.TENANT.VIEW_ANALYTICS,
    PERMISSIONS.TENANT.CONFIGURE_INTEGRATIONS,
    PERMISSIONS.TICKET.VIEW_ALL,
    PERMISSIONS.TICKET.CREATE,
    PERMISSIONS.TICKET.UPDATE,
    PERMISSIONS.TICKET.ASSIGN,
    PERMISSIONS.TICKET.RESOLVE,
    PERMISSIONS.CUSTOMER.VIEW_ALL,
    PERMISSIONS.CUSTOMER.CREATE,
    PERMISSIONS.CUSTOMER.UPDATE,
    PERMISSIONS.CUSTOMER.DELETE,
    PERMISSIONS.CUSTOMER.EXPORT,
    PERMISSIONS.ANALYTICS.VIEW_DETAILED,
    PERMISSIONS.ANALYTICS.EXPORT,
  ],
  
  agent: [
    PERMISSIONS.TICKET.VIEW_ALL,
    PERMISSIONS.TICKET.CREATE,
    PERMISSIONS.TICKET.UPDATE,
    PERMISSIONS.TICKET.RESOLVE,
    PERMISSIONS.CUSTOMER.VIEW_ALL,
    PERMISSIONS.CUSTOMER.CREATE,
    PERMISSIONS.CUSTOMER.UPDATE,
    PERMISSIONS.ANALYTICS.VIEW_BASIC,
  ],
  
  customer: [
    PERMISSIONS.TICKET.VIEW_OWN,
    PERMISSIONS.TICKET.CREATE,
    PERMISSIONS.CUSTOMER.VIEW_OWN,
  ],
};

export class RBACService {
  private static instance: RBACService;
  
  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  getRolePermissions(role: string): Permission[] {
    return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
  }

  async getUserPermissions(userId: string, tenantId?: string): Promise<Permission[]> {
    const user = await storageSimple.getUser(userId);
    if (!user) return [];

    const rolePermissions = this.getRolePermissions(user.role);
    
    // Filter permissions based on tenant context
    if (tenantId && user.tenantId !== tenantId && user.role !== 'saas_admin') {
      return rolePermissions.filter(p => p.resource !== 'platform');
    }

    return rolePermissions;
  }

  async hasPermission(user: AuthorizedUser, permission: Permission, context?: any): Promise<boolean> {
    // Check if user has permissions array
    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    
    // Check if user has the permission
    const hasPermission = user.permissions.some(p => 
      p.resource === permission.resource && p.action === permission.action
    );

    if (!hasPermission) return false;

    // Apply ABAC conditions if any
    if (permission.conditions) {
      return this.evaluateConditions(permission.conditions, user, context);
    }

    return true;
  }

  private evaluateConditions(conditions: Record<string, any>, user: AuthorizedUser, context?: any): boolean {
    // Example condition evaluation
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'tenant_id':
          if (user.tenantId !== value) return false;
          break;
        case 'owner_id':
          if (context?.ownerId !== user.id) return false;
          break;
        case 'resource_tenant':
          if (context?.tenantId !== user.tenantId) return false;
          break;
        case 'time_range':
          const now = new Date();
          if (now < new Date(value.start) || now > new Date(value.end)) return false;
          break;
        default:
          // Custom attribute check
          if (user.attributes[key] !== value) return false;
      }
    }
    return true;
  }

  async canAccessResource(user: AuthorizedUser, resource: string, action: string, context?: any): Promise<boolean> {
    const permission = { resource, action };
    return this.hasPermission(user, permission, context);
  }
}

export const rbacService = RBACService.getInstance();

// Enhanced authorization middleware factory
export function requirePermission(resource: string, action: string, contextProvider?: (req: Request) => any) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const context = contextProvider ? contextProvider(req) : undefined;
    const hasPermission = await rbacService.canAccessResource(req.user, resource, action, context);

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: { resource, action },
        userRole: req.user.role 
      });
    }

    next();
  };
}

// Tenant isolation middleware
export function requireTenantAccess(tenantIdParam: string = 'tenantId') {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const requestedTenantId = req.params[tenantIdParam] || req.body.tenantId || req.query.tenantId;
    
    // SaaS admins can access any tenant
    if (req.user.role === 'saas_admin') {
      return next();
    }

    // Other users can only access their own tenant
    if (req.user.tenantId !== requestedTenantId) {
      return res.status(403).json({ 
        message: 'Access denied to tenant',
        userTenant: req.user.tenantId,
        requestedTenant: requestedTenantId
      });
    }

    next();
  };
}

// Dynamic permission middleware
export function requireDynamicPermission(permissionProvider: (req: Request) => { resource: string; action: string }) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { resource, action } = permissionProvider(req);
    const hasPermission = await rbacService.canAccessResource(req.user, resource, action);

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: { resource, action },
        userRole: req.user.role 
      });
    }

    next();
  };
}

// Resource ownership middleware
export function requireResourceOwnership(resourceProvider: (req: Request) => Promise<{ ownerId: string; tenantId: string }>) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const resource = await resourceProvider(req);
      
      // Check tenant access
      if (req.user.tenantId !== resource.tenantId && req.user.role !== 'saas_admin') {
        return res.status(403).json({ message: 'Access denied to resource tenant' });
      }

      // Check ownership (for customers accessing their own resources)
      if (req.user.role === 'customer' && req.user.id !== resource.ownerId) {
        return res.status(403).json({ message: 'Access denied to resource' });
      }

      next();
    } catch (error) {
      return res.status(404).json({ message: 'Resource not found' });
    }
  };
}

// Permission checking utilities
export const PermissionUtils = {
  canManageTenants: (user: AuthorizedUser) => rbacService.canAccessResource(user, 'platform', 'manage_tenants'),
  canManageUsers: (user: AuthorizedUser) => rbacService.canAccessResource(user, 'tenant', 'manage_users'),
  canViewAllTickets: (user: AuthorizedUser) => rbacService.canAccessResource(user, 'ticket', 'view_all'),
  canAssignTickets: (user: AuthorizedUser) => rbacService.canAccessResource(user, 'ticket', 'assign'),
  canExportData: (user: AuthorizedUser) => rbacService.canAccessResource(user, 'analytics', 'export'),
};

export default rbacService;