/**
 * SaaS Admin Domain Entity
 * Clean Architecture - Domain Layer
 * 
 * @module SaasAdminEntity
 * @created 2025-08-12 - Phase 18 Clean Architecture Implementation
 */

export interface SystemOverview {
  id: string;
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalTickets: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  systemLoad: number;
  databaseConnections: number;
  storageUsage: number; // GB
  bandwidth: number; // GB/month
  uptime: number; // seconds
  lastHealthCheck: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantManagement {
  id: string;
  tenantId: string;
  tenantName: string;
  companyName: string;
  adminEmail: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending' | 'cancelled';
  userCount: number;
  ticketCount: number;
  storageUsed: number; // MB
  lastActivity: Date;
  createdAt: Date;
  expiresAt?: Date;
  billingStatus: 'current' | 'overdue' | 'cancelled';
  features: string[];
  limits: {
    maxUsers: number;
    maxTickets: number;
    maxStorage: number; // MB
    maxIntegrations: number;
  };
  usage: {
    currentUsers: number;
    currentTickets: number;
    currentStorage: number; // MB
    currentIntegrations: number;
  };
  settings: Record<string, any>;
  isActive: boolean;
}

export interface SystemConfiguration {
  id: string;
  configKey: string;
  configValue: string | number | boolean | object;
  category: 'system' | 'security' | 'billing' | 'features' | 'limits' | 'integrations';
  description: string;
  isGlobal: boolean;
  tenantId?: string; // null for global configs
  validationRules?: Record<string, any>;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface UserManagement {
  id: string;
  userId: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'saas_admin' | 'tenant_admin' | 'agent' | 'customer';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  lastLogin: Date;
  loginCount: number;
  permissions: string[];
  twoFactorEnabled: boolean;
  accountLocked: boolean;
  passwordLastChanged: Date;
  profileCompleteness: number; // percentage
  preferredLanguage: string;
  timezone: string;
  notificationSettings: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemAudit {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: 'tenant' | 'user' | 'config' | 'system' | 'billing';
  entityId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isActive: boolean;
}

export interface BillingOverview {
  id: string;
  tenantId: string;
  plan: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
  paymentMethod: string;
  paymentStatus: 'current' | 'overdue' | 'failed' | 'cancelled';
  totalInvoices: number;
  paidInvoices: number;
  overdueAmount: number;
  lifetime: {
    totalRevenue: number;
    totalInvoices: number;
    averageMonthlyRevenue: number;
  };
  lastPayment: {
    amount: number;
    date: Date;
    status: 'success' | 'failed' | 'pending';
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SaaS Admin Business Rules and Validations
 */
export class SaasAdminDomainService {
  /**
   * Validate system health status
   */
  static validateSystemHealth(systemLoad: number, databaseConnections: number, storageUsage: number): 'healthy' | 'warning' | 'critical' {
    if (systemLoad > 90 || databaseConnections > 1000 || storageUsage > 90) {
      return 'critical';
    }
    if (systemLoad > 70 || databaseConnections > 500 || storageUsage > 70) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Validate tenant limits
   */
  static validateTenantLimits(tenant: TenantManagement): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (tenant.usage.currentUsers > tenant.limits.maxUsers) {
      errors.push(`Usuários excedem o limite: ${tenant.usage.currentUsers}/${tenant.limits.maxUsers}`);
    }
    if (tenant.usage.currentTickets > tenant.limits.maxTickets) {
      errors.push(`Tickets excedem o limite: ${tenant.usage.currentTickets}/${tenant.limits.maxTickets}`);
    }
    if (tenant.usage.currentStorage > tenant.limits.maxStorage) {
      errors.push(`Storage excede o limite: ${tenant.usage.currentStorage}MB/${tenant.limits.maxStorage}MB`);
    }
    if (tenant.usage.currentIntegrations > tenant.limits.maxIntegrations) {
      errors.push(`Integrações excedem o limite: ${tenant.usage.currentIntegrations}/${tenant.limits.maxIntegrations}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate tenant utilization percentage
   */
  static calculateTenantUtilization(tenant: TenantManagement): {
    users: number;
    tickets: number;
    storage: number;
    integrations: number;
    overall: number;
  } {
    const users = Math.round((tenant.usage.currentUsers / tenant.limits.maxUsers) * 100);
    const tickets = Math.round((tenant.usage.currentTickets / tenant.limits.maxTickets) * 100);
    const storage = Math.round((tenant.usage.currentStorage / tenant.limits.maxStorage) * 100);
    const integrations = Math.round((tenant.usage.currentIntegrations / tenant.limits.maxIntegrations) * 100);
    
    const overall = Math.round((users + tickets + storage + integrations) / 4);
    
    return { users, tickets, storage, integrations, overall };
  }

  /**
   * Determine tenant health status
   */
  static getTenantHealthStatus(tenant: TenantManagement): 'healthy' | 'warning' | 'critical' {
    const utilization = this.calculateTenantUtilization(tenant);
    
    if (utilization.overall > 90 || tenant.billingStatus === 'overdue') {
      return 'critical';
    }
    if (utilization.overall > 70 || tenant.status === 'suspended') {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Validate system configuration
   */
  static validateSystemConfig(config: Partial<SystemConfiguration>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.configKey) errors.push('Chave de configuração é obrigatória');
    if (!config.category) errors.push('Categoria é obrigatória');
    if (!config.description) errors.push('Descrição é obrigatória');
    if (config.configValue === undefined || config.configValue === null) {
      errors.push('Valor da configuração é obrigatório');
    }

    const validCategories = ['system', 'security', 'billing', 'features', 'limits', 'integrations'];
    if (config.category && !validCategories.includes(config.category)) {
      errors.push('Categoria inválida');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate system performance metrics
   */
  static calculateSystemMetrics(tenants: TenantManagement[]): {
    totalRevenue: number;
    averageUtilization: number;
    healthyTenants: number;
    warningTenants: number;
    criticalTenants: number;
    churnRate: number;
    growthRate: number;
  } {
    const totalRevenue = tenants.reduce((sum, tenant) => {
      // Mock calculation - would integrate with billing system
      const planRevenue = { free: 0, basic: 29, pro: 99, enterprise: 299 };
      return sum + (planRevenue[tenant.plan] || 0);
    }, 0);

    const utilizationSum = tenants.reduce((sum, tenant) => {
      return sum + this.calculateTenantUtilization(tenant).overall;
    }, 0);
    const averageUtilization = tenants.length > 0 ? utilizationSum / tenants.length : 0;

    let healthyTenants = 0, warningTenants = 0, criticalTenants = 0;
    tenants.forEach(tenant => {
      const health = this.getTenantHealthStatus(tenant);
      if (health === 'healthy') healthyTenants++;
      else if (health === 'warning') warningTenants++;
      else criticalTenants++;
    });

    // Mock calculations for churn and growth - would use historical data
    const churnRate = Math.random() * 5; // 0-5%
    const growthRate = Math.random() * 20 + 5; // 5-25%

    return {
      totalRevenue,
      averageUtilization: Math.round(averageUtilization),
      healthyTenants,
      warningTenants,
      criticalTenants,
      churnRate: Math.round(churnRate * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100
    };
  }

  /**
   * Check if user has SaaS admin permissions
   */
  static hasSaasAdminPermission(userRole: string): boolean {
    return userRole === 'saas_admin';
  }

  /**
   * Validate audit action severity
   */
  static calculateAuditSeverity(action: string, entityType: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalActions = ['delete', 'suspend', 'disable', 'modify_billing'];
    const highActions = ['create', 'update', 'activate', 'deactivate'];
    const mediumActions = ['view_sensitive', 'export', 'import'];
    
    if (criticalActions.some(a => action.toLowerCase().includes(a))) {
      return 'critical';
    }
    if (highActions.some(a => action.toLowerCase().includes(a)) && entityType !== 'system') {
      return 'high';
    }
    if (mediumActions.some(a => action.toLowerCase().includes(a))) {
      return 'medium';
    }
    return 'low';
  }
}