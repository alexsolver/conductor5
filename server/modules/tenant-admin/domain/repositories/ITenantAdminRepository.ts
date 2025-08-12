/**
 * Tenant Admin Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module ITenantAdminRepository
 * @created 2025-08-12 - Phase 22 Clean Architecture Implementation
 */

import { TenantAdmin, TenantConfiguration, TenantBilling, TenantUsage, UsageAlert, UsageRecommendation, HealthCheck, MonitoringAlert } from '../entities/TenantAdmin';

export interface ITenantAdminRepository {
  // Basic CRUD Operations
  create(tenantAdmin: Omit<TenantAdmin, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantAdmin>;
  findById(id: string): Promise<TenantAdmin | null>;
  findByTenantId(tenantId: string): Promise<TenantAdmin | null>;
  findByAdminUserId(adminUserId: string): Promise<TenantAdmin[]>;
  update(id: string, updates: Partial<TenantAdmin>): Promise<TenantAdmin | null>;
  delete(id: string): Promise<boolean>;

  // Query Operations
  findAll(filters?: {
    status?: string;
    role?: string;
    planType?: string;
    lastAccessSince?: Date;
  }): Promise<TenantAdmin[]>;

  findByStatus(status: string): Promise<TenantAdmin[]>;
  findByRole(role: string): Promise<TenantAdmin[]>;
  findByPlan(planType: string): Promise<TenantAdmin[]>;
  findActiveAdmins(): Promise<TenantAdmin[]>;
  findSuspendedTenants(): Promise<TenantAdmin[]>;

  // Search Operations
  search(query: string, filters?: {
    status?: string;
    role?: string;
    planType?: string;
  }): Promise<TenantAdmin[]>;

  searchByTenantName(tenantName: string): Promise<TenantAdmin[]>;
  searchByAdminEmail(email: string): Promise<TenantAdmin[]>;

  // Configuration Management
  updateConfiguration(tenantId: string, configuration: Partial<TenantConfiguration>): Promise<boolean>;
  getConfiguration(tenantId: string): Promise<TenantConfiguration | null>;
  validateConfiguration(tenantId: string, configuration: Partial<TenantConfiguration>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  backupConfiguration(tenantId: string): Promise<{
    backupId: string;
    timestamp: Date;
    configuration: TenantConfiguration;
  }>;

  restoreConfiguration(tenantId: string, backupId: string): Promise<boolean>;

  getConfigurationHistory(tenantId: string, limit?: number): Promise<Array<{
    timestamp: Date;
    changes: string[];
    changedBy: string;
    version: string;
  }>>;

  // Billing Management
  updateBilling(tenantId: string, billing: Partial<TenantBilling>): Promise<boolean>;
  getBilling(tenantId: string): Promise<TenantBilling | null>;
  
  createInvoice(tenantId: string, invoiceData: {
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    dueDate: Date;
  }): Promise<{
    invoiceId: string;
    number: string;
    amount: number;
    dueDate: Date;
  }>;

  processPayment(tenantId: string, invoiceId: string, paymentData: {
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  }): Promise<{
    success: boolean;
    transactionId: string;
    paidAt: Date;
  }>;

  getBillingHistory(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<Array<{
    date: Date;
    type: 'invoice' | 'payment' | 'credit' | 'refund';
    amount: number;
    description: string;
    status: string;
  }>>;

  calculateUsageCharges(tenantId: string, period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    baseCharges: number;
    usageCharges: number;
    totalCharges: number;
    breakdown: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
  }>;

  // Usage Tracking
  updateUsage(tenantId: string, usage: Partial<TenantUsage>): Promise<boolean>;
  getUsage(tenantId: string): Promise<TenantUsage | null>;
  
  recordUsageMetric(tenantId: string, metric: string, value: number, timestamp?: Date): Promise<boolean>;
  
  getUsageMetrics(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    metrics: Array<{
      timestamp: Date;
      metric: string;
      value: number;
    }>;
    aggregates: {
      total: Record<string, number>;
      average: Record<string, number>;
      peak: Record<string, number>;
    };
  }>;

  getUsageAlerts(tenantId: string): Promise<UsageAlert[]>;
  createUsageAlert(tenantId: string, alert: Omit<UsageAlert, 'id' | 'triggeredAt'>): Promise<UsageAlert>;
  updateUsageAlert(tenantId: string, alertId: string, updates: Partial<UsageAlert>): Promise<boolean>;
  deleteUsageAlert(tenantId: string, alertId: string): Promise<boolean>;

  getUsageRecommendations(tenantId: string): Promise<UsageRecommendation[]>;
  generateUsageReport(tenantId: string, reportType: 'daily' | 'weekly' | 'monthly', format: 'json' | 'csv' | 'pdf'): Promise<{
    reportId: string;
    data: any;
    generatedAt: Date;
  }>;

  // Permission Management
  addPermission(tenantId: string, permission: {
    adminUserId: string;
    module: string;
    action: string;
    resource: string;
    conditions?: any[];
    expiresAt?: Date;
  }): Promise<boolean>;

  removePermission(tenantId: string, permissionId: string): Promise<boolean>;
  
  updatePermission(tenantId: string, permissionId: string, updates: {
    conditions?: any[];
    expiresAt?: Date;
  }): Promise<boolean>;

  getPermissions(tenantId: string, adminUserId?: string): Promise<Array<{
    id: string;
    module: string;
    action: string;
    resource: string;
    conditions?: any[];
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
  }>>;

  checkPermission(tenantId: string, adminUserId: string, module: string, action: string, resource?: string): Promise<boolean>;

  // Health Monitoring
  updateHealth(tenantId: string, healthData: {
    checks: HealthCheck[];
    issues?: Array<{
      severity: string;
      title: string;
      description: string;
      recommendations: string[];
    }>;
  }): Promise<boolean>;

  getHealth(tenantId: string): Promise<{
    status: 'healthy' | 'warning' | 'critical' | 'maintenance';
    score: number;
    checks: HealthCheck[];
    issues: Array<{
      id: string;
      severity: string;
      title: string;
      description: string;
      recommendations: string[];
      createdAt: Date;
      status: string;
    }>;
    lastCheck: Date;
  }>;

  runHealthCheck(tenantId: string): Promise<{
    status: string;
    score: number;
    checks: HealthCheck[];
    recommendations: string[];
  }>;

  getHealthHistory(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<Array<{
    timestamp: Date;
    status: string;
    score: number;
    issues: number;
  }>>;

  // Monitoring & Analytics
  updateMonitoring(tenantId: string, monitoringData: {
    uptime?: number;
    responseTime?: number;
    errorRate?: number;
    throughput?: number;
    resourceUsage?: {
      cpu: number;
      memory: number;
      storage: number;
      bandwidth: number;
      database: number;
    };
  }): Promise<boolean>;

  getMonitoring(tenantId: string): Promise<{
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      storage: number;
      bandwidth: number;
      database: number;
    };
    alerts: MonitoringAlert[];
  }>;

  addMonitoringAlert(tenantId: string, alert: Omit<MonitoringAlert, 'id' | 'triggeredAt'>): Promise<MonitoringAlert>;
  updateMonitoringAlert(tenantId: string, alertId: string, updates: Partial<MonitoringAlert>): Promise<boolean>;
  getMonitoringAlerts(tenantId: string, status?: string): Promise<MonitoringAlert[]>;

  getPerformanceMetrics(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    metrics: Array<{
      timestamp: Date;
      uptime: number;
      responseTime: number;
      errorRate: number;
      throughput: number;
    }>;
    trends: Array<{
      metric: string;
      direction: 'up' | 'down' | 'stable';
      percentage: number;
    }>;
  }>;

  // Tenant Lifecycle Management
  provisionTenant(tenantData: {
    tenantId: string;
    adminUserId: string;
    planId: string;
    configuration: Partial<TenantConfiguration>;
  }): Promise<{
    success: boolean;
    tenantAdmin: TenantAdmin;
    provisioningLog: string[];
  }>;

  suspendTenant(tenantId: string, reason: string, suspendedBy: string): Promise<boolean>;
  reactivateTenant(tenantId: string, reactivatedBy: string): Promise<boolean>;
  terminateTenant(tenantId: string, reason: string, terminatedBy: string): Promise<{
    success: boolean;
    backupId?: string;
    dataExportUrl?: string;
  }>;

  migrateTenant(tenantId: string, targetPlan: string, migrationOptions?: {
    preserveData: boolean;
    migrateAddons: boolean;
    scheduledAt?: Date;
  }): Promise<{
    success: boolean;
    migrationId: string;
    estimatedCompletion: Date;
  }>;

  // Bulk Operations
  bulkUpdateConfiguration(updates: Array<{
    tenantId: string;
    configuration: Partial<TenantConfiguration>;
  }>): Promise<Array<{
    tenantId: string;
    success: boolean;
    error?: string;
  }>>;

  bulkUpdateBilling(updates: Array<{
    tenantId: string;
    billing: Partial<TenantBilling>;
  }>): Promise<Array<{
    tenantId: string;
    success: boolean;
    error?: string;
  }>>;

  bulkChangeStatus(tenantIds: string[], status: string, changedBy: string): Promise<Array<{
    tenantId: string;
    success: boolean;
    error?: string;
  }>>;

  // Reporting & Analytics
  generateAnalyticsReport(reportType: 'usage' | 'billing' | 'performance' | 'health', options: {
    tenantIds?: string[];
    timeRange?: {
      startDate: Date;
      endDate: Date;
    };
    groupBy?: 'tenant' | 'plan' | 'region' | 'industry';
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<{
    reportId: string;
    data: any;
    summary: any;
    generatedAt: Date;
  }>;

  getTenantAnalytics(tenantId: string): Promise<{
    overview: {
      usersCount: number;
      ticketsCount: number;
      storageUsed: number;
      apiCallsThisMonth: number;
      uptime: number;
      healthScore: number;
    };
    trends: Array<{
      metric: string;
      direction: 'up' | 'down' | 'stable';
      percentage: number;
      period: string;
    }>;
    predictions: Array<{
      metric: string;
      predictedValue: number;
      confidence: number;
      timeframe: string;
    }>;
    recommendations: UsageRecommendation[];
  }>;

  getSystemAnalytics(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalRevenue: number;
    averageHealthScore: number;
    systemUptime: number;
    tenantsByPlan: Record<string, number>;
    tenantsByStatus: Record<string, number>;
    revenueByPlan: Record<string, number>;
    topIssues: Array<{
      issue: string;
      affectedTenants: number;
      severity: string;
    }>;
  }>;

  // Import/Export Operations
  exportTenantData(tenantId: string, options?: {
    includeConfiguration: boolean;
    includeBilling: boolean;
    includeUsage: boolean;
    includeHealth: boolean;
    format: 'json' | 'csv' | 'xml';
  }): Promise<{
    exportId: string;
    downloadUrl: string;
    expiresAt: Date;
  }>;

  importTenantData(tenantId: string, data: any, options?: {
    overwriteExisting: boolean;
    validateBeforeImport: boolean;
    createBackup: boolean;
  }): Promise<{
    success: boolean;
    importId: string;
    errors: string[];
    warnings: string[];
    backupId?: string;
  }>;

  // Maintenance Operations
  performMaintenance(tenantId: string, maintenanceType: 'backup' | 'cleanup' | 'optimization' | 'migration', options?: any): Promise<{
    success: boolean;
    maintenanceId: string;
    duration: number;
    results: any;
  }>;

  scheduleMaintenance(tenantId: string, maintenanceType: string, scheduledAt: Date, options?: any): Promise<{
    scheduleId: string;
    scheduledAt: Date;
    estimatedDuration: number;
  }>;

  getMaintenanceHistory(tenantId: string): Promise<Array<{
    id: string;
    type: string;
    performedAt: Date;
    duration: number;
    status: 'completed' | 'failed' | 'cancelled';
    results: any;
    performedBy: string;
  }>>;

  // Backup & Recovery
  createBackup(tenantId: string, backupType: 'full' | 'incremental' | 'configuration_only'): Promise<{
    backupId: string;
    size: number;
    createdAt: Date;
    expiresAt: Date;
  }>;

  restoreFromBackup(tenantId: string, backupId: string, options?: {
    restoreConfiguration: boolean;
    restoreBilling: boolean;
    restoreUsage: boolean;
    createPreRestoreBackup: boolean;
  }): Promise<{
    success: boolean;
    restoreId: string;
    preRestoreBackupId?: string;
    restoredAt: Date;
  }>;

  getBackups(tenantId: string): Promise<Array<{
    backupId: string;
    type: string;
    size: number;
    createdAt: Date;
    expiresAt: Date;
    status: 'available' | 'expired' | 'corrupted';
  }>>;

  deleteBackup(tenantId: string, backupId: string): Promise<boolean>;

  // System Integration
  syncWithExternalSystems(tenantId: string, systems: string[]): Promise<Array<{
    system: string;
    success: boolean;
    syncedAt: Date;
    error?: string;
  }>>;

  getIntegrationStatus(tenantId: string): Promise<Array<{
    system: string;
    status: 'connected' | 'disconnected' | 'error' | 'syncing';
    lastSync?: Date;
    nextSync?: Date;
    error?: string;
  }>>;

  configureIntegration(tenantId: string, system: string, configuration: any): Promise<{
    success: boolean;
    integrationId: string;
    status: string;
  }>;
}