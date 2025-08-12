/**
 * SaaS Admin Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module ISaasAdminRepository
 * @created 2025-08-12 - Phase 18 Clean Architecture Implementation
 */

import { 
  SystemOverview, 
  TenantManagement, 
  SystemConfiguration, 
  UserManagement, 
  SystemAudit, 
  BillingOverview 
} from '../entities/SaasAdmin';

export interface ISaasAdminRepository {
  // System Overview
  getSystemOverview(): Promise<SystemOverview | null>;
  updateSystemOverview(overview: Omit<SystemOverview, 'id' | 'createdAt' | 'updatedAt'>): Promise<SystemOverview>;

  // Tenant Management
  getAllTenants(filters?: {
    status?: string;
    plan?: string;
    healthStatus?: string;
    search?: string;
  }): Promise<TenantManagement[]>;
  getTenantById(tenantId: string): Promise<TenantManagement | null>;
  updateTenant(tenantId: string, updates: Partial<TenantManagement>): Promise<TenantManagement | null>;
  suspendTenant(tenantId: string, reason: string, adminId: string): Promise<boolean>;
  activateTenant(tenantId: string, adminId: string): Promise<boolean>;
  deleteTenant(tenantId: string, adminId: string): Promise<boolean>;
  getTenantUsageStats(tenantId: string): Promise<{
    users: number;
    tickets: number;
    storage: number;
    integrations: number;
  }>;

  // System Configuration
  getSystemConfigurations(category?: string): Promise<SystemConfiguration[]>;
  getSystemConfiguration(configKey: string, tenantId?: string): Promise<SystemConfiguration | null>;
  createSystemConfiguration(config: Omit<SystemConfiguration, 'id' | 'createdAt' | 'lastModifiedAt'>): Promise<SystemConfiguration>;
  updateSystemConfiguration(configKey: string, updates: Partial<SystemConfiguration>): Promise<SystemConfiguration | null>;
  deleteSystemConfiguration(configKey: string, tenantId?: string): Promise<boolean>;

  // User Management (Global)
  getAllUsers(filters?: {
    role?: string;
    status?: string;
    tenantId?: string;
    search?: string;
  }): Promise<UserManagement[]>;
  getUserById(userId: string): Promise<UserManagement | null>;
  updateUserStatus(userId: string, status: string, adminId: string): Promise<boolean>;
  resetUserPassword(userId: string, adminId: string): Promise<boolean>;
  getUserLoginHistory(userId: string, limit?: number): Promise<Array<{
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    success: boolean;
  }>>;

  // System Audit
  createAuditEntry(audit: Omit<SystemAudit, 'id' | 'timestamp'>): Promise<SystemAudit>;
  getAuditLog(filters?: {
    adminId?: string;
    entityType?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<SystemAudit[]>;
  getAuditByEntity(entityType: string, entityId: string): Promise<SystemAudit[]>;

  // Billing Overview
  getAllBillingOverviews(): Promise<BillingOverview[]>;
  getBillingOverview(tenantId: string): Promise<BillingOverview | null>;
  updateBillingStatus(tenantId: string, status: string, adminId: string): Promise<boolean>;

  // Analytics & Reports
  getSystemAnalytics(timeRange: string): Promise<{
    tenantGrowth: Array<{ date: string; count: number }>;
    revenueGrowth: Array<{ date: string; revenue: number }>;
    userActivity: Array<{ date: string; activeUsers: number }>;
    systemPerformance: Array<{ 
      timestamp: Date; 
      systemLoad: number; 
      responseTime: number; 
      errorRate: number; 
    }>;
    topPlans: Array<{ plan: string; count: number; revenue: number }>;
    churnAnalysis: {
      rate: number;
      reasons: Array<{ reason: string; count: number }>;
    };
  }>;

  // System Health & Monitoring
  getSystemHealthMetrics(): Promise<{
    uptime: number;
    systemLoad: number;
    memoryUsage: number;
    diskUsage: number;
    databaseConnections: number;
    activeUsers: number;
    responseTime: number;
    errorRate: number;
    lastCheck: Date;
  }>;

  // Feature Flags & Toggles
  getFeatureFlags(): Promise<Array<{
    id: string;
    flagKey: string;
    enabled: boolean;
    description: string;
    tenantIds?: string[];
    createdAt: Date;
  }>>;
  
  updateFeatureFlag(flagKey: string, enabled: boolean, tenantIds?: string[]): Promise<boolean>;

  // Backup & Recovery
  createSystemBackup(): Promise<{
    id: string;
    filename: string;
    size: number;
    createdAt: Date;
  }>;

  getBackupHistory(limit?: number): Promise<Array<{
    id: string;
    filename: string;
    size: number;
    status: 'completed' | 'failed' | 'in_progress';
    createdAt: Date;
  }>>;

  // Maintenance Mode
  enableMaintenanceMode(message: string, adminId: string): Promise<boolean>;
  disableMaintenanceMode(adminId: string): Promise<boolean>;
  getMaintenanceStatus(): Promise<{
    enabled: boolean;
    message?: string;
    enabledAt?: Date;
    enabledBy?: string;
  }>;
}