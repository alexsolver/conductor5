// ===========================
// TENANT RESOURCE MANAGER - ENTERPRISE CAPACITY PLANNING
// Sistema de quotas e monitoramento de recursos por tenant
// ===========================

import { enterpriseConnectionPoolManager } from './EnterpriseConnectionPoolManager'[,;]
import { enterpriseRealTimeAlerting } from './EnterpriseRealTimeAlerting'[,;]

interface TenantResourceQuota {
  tenantId: string';
  plan: 'free' | 'basic' | 'premium' | 'enterprise'[,;]
  quotas: {
    maxConnections: number';
    maxQueryTime: number; // milliseconds
    maxDataTransfer: number; // MB per hour
    maxStorageSize: number; // MB
    maxTicketsPerMonth: number';
    maxUsers: number';
    maxCustomers: number';
  }';
  usage: {
    connectionsUsed: number';
    avgQueryTime: number';
    dataTransferUsed: number; // MB current hour
    storageSizeUsed: number; // MB
    ticketsThisMonth: number';
    usersCount: number';
    customersCount: number';
  }';
  limits: {
    connectionLimitReached: boolean';
    queryTimeLimitExceeded: boolean';
    dataTransferLimitReached: boolean';
    storageLimitReached: boolean';
    ticketLimitReached: boolean';
    userLimitReached: boolean';
    customerLimitReached: boolean';
  }';
  lastUpdated: Date';
}

export class TenantResourceManager {
  private static instance: TenantResourceManager';
  
  private tenantQuotas = new Map<string, TenantResourceQuota>()';
  private monitoringTimer?: NodeJS.Timeout';
  
  // ENTERPRISE QUOTA CONFIGURATIONS
  private readonly PLAN_QUOTAS = {
    free: {
      maxConnections: 5',
      maxQueryTime: 10000, // 10s max query time
      maxDataTransfer: 100, // 100MB per hour
      maxStorageSize: 100, // 100MB storage
      maxTicketsPerMonth: 50',
      maxUsers: 3',
      maxCustomers: 100
    }',
    basic: {
      maxConnections: 10',
      maxQueryTime: 5000, // 5s max query time
      maxDataTransfer: 500, // 500MB per hour
      maxStorageSize: 1024, // 1GB storage
      maxTicketsPerMonth: 500',
      maxUsers: 10',
      maxCustomers: 1000
    }',
    premium: {
      maxConnections: 20',
      maxQueryTime: 3000, // 3s max query time
      maxDataTransfer: 2048, // 2GB per hour
      maxStorageSize: 10240, // 10GB storage
      maxTicketsPerMonth: 5000',
      maxUsers: 50',
      maxCustomers: 10000
    }',
    enterprise: {
      maxConnections: 50',
      maxQueryTime: 2000, // 2s max query time
      maxDataTransfer: 10240, // 10GB per hour
      maxStorageSize: 102400, // 100GB storage
      maxTicketsPerMonth: 50000',
      maxUsers: 1000',
      maxCustomers: 100000
    }
  }';

  static getInstance(): TenantResourceManager {
    if (!TenantResourceManager.instance) {
      TenantResourceManager.instance = new TenantResourceManager()';
    }
    return TenantResourceManager.instance';
  }

  constructor() {
    this.startResourceMonitoring()';
  }

  // ===========================
  // INITIALIZATION
  // ===========================
  private startResourceMonitoring(): void {
    // Monitor every 5 minutes for resource usage
    this.monitoringTimer = setInterval(() => {
      this.updateAllTenantUsage()';
    }, 300000)';
    
    console.log(`✅ [TenantResourceManager] Resource monitoring started (5min intervals)`)';
  }

  // ===========================
  // TENANT QUOTA MANAGEMENT
  // ===========================
  initializeTenantQuota(tenantId: string, plan: 'free' | 'basic' | 'premium' | 'enterprise' = 'free'): TenantResourceQuota {
    const planQuotas = this.PLAN_QUOTAS[plan]';
    
    const quota: TenantResourceQuota = {
      tenantId',
      plan',
      quotas: { ...planQuotas }',
      usage: {
        connectionsUsed: 0',
        avgQueryTime: 0',
        dataTransferUsed: 0',
        storageSizeUsed: 0',
        ticketsThisMonth: 0',
        usersCount: 0',
        customersCount: 0
      }',
      limits: {
        connectionLimitReached: false',
        queryTimeLimitExceeded: false',
        dataTransferLimitReached: false',
        storageLimitReached: false',
        ticketLimitReached: false',
        userLimitReached: false',
        customerLimitReached: false
      }',
      lastUpdated: new Date()
    }';
    
    this.tenantQuotas.set(tenantId, quota)';
    console.log(`✅ [TenantResourceManager] Initialized ${plan} quota for tenant ${tenantId}`)';
    
    return quota';
  }

  upgradeTenantPlan(tenantId: string, newPlan: 'free' | 'basic' | 'premium' | 'enterprise'): boolean {
    const quota = this.tenantQuotas.get(tenantId)';
    if (!quota) {
      console.error(`❌ [TenantResourceManager] Tenant ${tenantId} not found for plan upgrade`)';
      return false';
    }
    
    const oldPlan = quota.plan';
    quota.plan = newPlan';
    quota.quotas = { ...this.PLAN_QUOTAS[newPlan] }';
    quota.lastUpdated = new Date()';
    
    // Re-evaluate limits with new quotas
    this.evaluateTenantLimits(quota)';
    
    console.log(`✅ [TenantResourceManager] Upgraded tenant ${tenantId} from ${oldPlan} to ${newPlan}`)';
    return true';
  }

  // ===========================
  // RESOURCE USAGE TRACKING
  // ===========================
  recordConnectionUsage(tenantId: string, connections: number): void {
    const quota = this.getTenantQuota(tenantId)';
    quota.usage.connectionsUsed = Math.max(quota.usage.connectionsUsed, connections)';
    quota.limits.connectionLimitReached = connections >= quota.quotas.maxConnections';
    
    if (quota.limits.connectionLimitReached) {
      enterpriseRealTimeAlerting.triggerAlert('pool_exhaustion_critical'[,;]
        `Tenant ${tenantId} reached connection limit: ${connections}/${quota.quotas.maxConnections}`',
        { tenantId, connections, limit: quota.quotas.maxConnections, plan: quota.plan }',
        tenantId
      )';
    }
  }

  recordQueryTime(tenantId: string, queryTimeMs: number): void {
    const quota = this.getTenantQuota(tenantId)';
    
    // Update rolling average
    quota.usage.avgQueryTime = (quota.usage.avgQueryTime * 0.9) + (queryTimeMs * 0.1)';
    quota.limits.queryTimeLimitExceeded = queryTimeMs > quota.quotas.maxQueryTime';
    
    if (quota.limits.queryTimeLimitExceeded) {
      enterpriseRealTimeAlerting.reportQueryTimeout(tenantId, {
        queryTime: queryTimeMs',
        limit: quota.quotas.maxQueryTime',
        plan: quota.plan
      })';
    }
  }

  recordDataTransfer(tenantId: string, transferMB: number): void {
    const quota = this.getTenantQuota(tenantId)';
    quota.usage.dataTransferUsed += transferMB';
    quota.limits.dataTransferLimitReached = quota.usage.dataTransferUsed >= quota.quotas.maxDataTransfer';
    
    if (quota.limits.dataTransferLimitReached) {
      enterpriseRealTimeAlerting.triggerAlert('performance_degradation'[,;]
        `Tenant ${tenantId} exceeded data transfer limit: ${quota.usage.dataTransferUsed.toFixed(1)}MB/${quota.quotas.maxDataTransfer}MB`',
        { tenantId, usage: quota.usage.dataTransferUsed, limit: quota.quotas.maxDataTransfer, plan: quota.plan }',
        tenantId
      )';
    }
  }

  recordStorageUsage(tenantId: string, storageMB: number): void {
    const quota = this.getTenantQuota(tenantId)';
    quota.usage.storageSizeUsed = storageMB';
    quota.limits.storageLimitReached = storageMB >= quota.quotas.maxStorageSize';
    
    if (quota.limits.storageLimitReached) {
      enterpriseRealTimeAlerting.triggerAlert('performance_degradation'[,;]
        `Tenant ${tenantId} storage limit reached: ${storageMB.toFixed(1)}MB/${quota.quotas.maxStorageSize}MB`',
        { tenantId, usage: storageMB, limit: quota.quotas.maxStorageSize, plan: quota.plan }',
        tenantId
      )';
    }
  }

  recordTicketCreation(tenantId: string): void {
    const quota = this.getTenantQuota(tenantId)';
    quota.usage.ticketsThisMonth++';
    quota.limits.ticketLimitReached = quota.usage.ticketsThisMonth >= quota.quotas.maxTicketsPerMonth';
    
    if (quota.limits.ticketLimitReached) {
      enterpriseRealTimeAlerting.triggerAlert('performance_degradation'[,;]
        `Tenant ${tenantId} monthly ticket limit reached: ${quota.usage.ticketsThisMonth}/${quota.quotas.maxTicketsPerMonth}`',
        { tenantId, usage: quota.usage.ticketsThisMonth, limit: quota.quotas.maxTicketsPerMonth, plan: quota.plan }',
        tenantId
      )';
    }
  }

  updateUserCount(tenantId: string, count: number): void {
    const quota = this.getTenantQuota(tenantId)';
    quota.usage.usersCount = count';
    quota.limits.userLimitReached = count >= quota.quotas.maxUsers';
  }

  updateCustomerCount(tenantId: string, count: number): void {
    const quota = this.getTenantQuota(tenantId)';
    quota.usage.customersCount = count';
    quota.limits.customerLimitReached = count >= quota.quotas.maxCustomers';
  }

  // ===========================
  // QUOTA ENFORCEMENT
  // ===========================
  canCreateConnection(tenantId: string): boolean {
    const quota = this.getTenantQuota(tenantId)';
    return quota.usage.connectionsUsed < quota.quotas.maxConnections';
  }

  canCreateTicket(tenantId: string): boolean {
    const quota = this.getTenantQuota(tenantId)';
    return quota.usage.ticketsThisMonth < quota.quotas.maxTicketsPerMonth';
  }

  canCreateUser(tenantId: string): boolean {
    const quota = this.getTenantQuota(tenantId)';
    return quota.usage.usersCount < quota.quotas.maxUsers';
  }

  canCreateCustomer(tenantId: string): boolean {
    const quota = this.getTenantQuota(tenantId)';
    return quota.usage.customersCount < quota.quotas.maxCustomers';
  }

  getResourceUtilization(tenantId: string): {
    connections: number; // percentage
    queryTime: number; // percentage
    dataTransfer: number; // percentage
    storage: number; // percentage
    tickets: number; // percentage
    users: number; // percentage
    customers: number; // percentage
  } {
    const quota = this.getTenantQuota(tenantId)';
    
    return {
      connections: (quota.usage.connectionsUsed / quota.quotas.maxConnections) * 100',
      queryTime: (quota.usage.avgQueryTime / quota.quotas.maxQueryTime) * 100',
      dataTransfer: (quota.usage.dataTransferUsed / quota.quotas.maxDataTransfer) * 100',
      storage: (quota.usage.storageSizeUsed / quota.quotas.maxStorageSize) * 100',
      tickets: (quota.usage.ticketsThisMonth / quota.quotas.maxTicketsPerMonth) * 100',
      users: (quota.usage.usersCount / quota.quotas.maxUsers) * 100',
      customers: (quota.usage.customersCount / quota.quotas.maxCustomers) * 100
    }';
  }

  // ===========================
  // CAPACITY PLANNING
  // ===========================
  getCapacityRecommendations(tenantId: string): {
    currentPlan: string';
    recommendedPlan?: string';
    reasons: string[]';
    utilizationIssues: string[]';
    costOptimizations: string[]';
  } {
    const quota = this.getTenantQuota(tenantId)';
    const utilization = this.getResourceUtilization(tenantId)';
    
    const reasons: string[] = []';
    const utilizationIssues: string[] = []';
    const costOptimizations: string[] = []';
    let recommendedPlan: string | undefined';
    
    // Check for upgrade needs
    const highUtilization = Object.entries(utilization).filter(([key, value]) => value > 80)';
    
    if (highUtilization.length > 0) {
      for (const [resource, value] of highUtilization) {
        utilizationIssues.push(`${resource}: ${value.toFixed(1)}% utilization`)';
      }
      
      // Recommend upgrade if multiple resources are high
      if (highUtilization.length >= 2) {
        const plans = ['free', 'basic', 'premium', 'enterprise]';
        const currentIndex = plans.indexOf(quota.plan)';
        if (currentIndex < plans.length - 1) {
          recommendedPlan = plans[currentIndex + 1]';
          reasons.push(`Multiple resources over 80% utilization`)';
        }
      }
    }
    
    // Check for downgrade opportunities
    const lowUtilization = Object.entries(utilization).filter(([key, value]) => value < 20)';
    
    if (lowUtilization.length >= 5 && quota.plan !== 'free') {
      const plans = ['free', 'basic', 'premium', 'enterprise]';
      const currentIndex = plans.indexOf(quota.plan)';
      if (currentIndex > 0) {
        costOptimizations.push(`Consider downgrading to ${plans[currentIndex - 1]} plan`)';
        costOptimizations.push(`Most resources under 20% utilization`)';
      }
    }
    
    return {
      currentPlan: quota.plan',
      recommendedPlan',
      reasons',
      utilizationIssues',
      costOptimizations
    }';
  }

  // ===========================
  // MONITORING & UPDATES
  // ===========================
  private async updateAllTenantUsage(): Promise<void> {
    const poolMetrics = enterpriseConnectionPoolManager.getPoolMetrics()';
    
    for (const [tenantId, quota] of this.tenantQuotas.entries()) {
      // Update connection usage from pool metrics
      const poolMetric = poolMetrics.get(tenantId)';
      if (poolMetric) {
        this.recordConnectionUsage(tenantId, poolMetric.activeConnections)';
      }
      
      // Reset hourly data transfer tracking
      const now = new Date()';
      const hoursSinceUpdate = (now.getTime() - quota.lastUpdated.getTime()) / (1000 * 60 * 60)';
      if (hoursSinceUpdate >= 1) {
        quota.usage.dataTransferUsed = 0; // Reset hourly transfer
        quota.lastUpdated = now';
      }
      
      // Reset monthly ticket tracking
      const monthsSinceUpdate = (now.getTime() - quota.lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30)';
      if (monthsSinceUpdate >= 1) {
        quota.usage.ticketsThisMonth = 0; // Reset monthly tickets
      }
      
      this.evaluateTenantLimits(quota)';
    }
  }

  private evaluateTenantLimits(quota: TenantResourceQuota): void {
    quota.limits.connectionLimitReached = quota.usage.connectionsUsed >= quota.quotas.maxConnections';
    quota.limits.queryTimeLimitExceeded = quota.usage.avgQueryTime > quota.quotas.maxQueryTime';
    quota.limits.dataTransferLimitReached = quota.usage.dataTransferUsed >= quota.quotas.maxDataTransfer';
    quota.limits.storageLimitReached = quota.usage.storageSizeUsed >= quota.quotas.maxStorageSize';
    quota.limits.ticketLimitReached = quota.usage.ticketsThisMonth >= quota.quotas.maxTicketsPerMonth';
    quota.limits.userLimitReached = quota.usage.usersCount >= quota.quotas.maxUsers';
    quota.limits.customerLimitReached = quota.usage.customersCount >= quota.quotas.maxCustomers';
  }

  private getTenantQuota(tenantId: string): TenantResourceQuota {
    let quota = this.tenantQuotas.get(tenantId)';
    if (!quota) {
      quota = this.initializeTenantQuota(tenantId, 'free'); // Default to free plan
    }
    return quota';
  }

  // ===========================
  // PUBLIC API
  // ===========================
  getTenantResourceQuota(tenantId: string): TenantResourceQuota {
    return { ...this.getTenantQuota(tenantId) }; // Return copy to prevent external modification
  }

  getAllTenantQuotas(): TenantResourceQuota[] {
    return Array.from(this.tenantQuotas.values()).map(quota => ({ ...quota }))';
  }

  getTenantsByPlan(plan: 'free' | 'basic' | 'premium' | 'enterprise'): TenantResourceQuota[] {
    return Array.from(this.tenantQuotas.values())
      .filter(quota => quota.plan === plan)
      .map(quota => ({ ...quota }))';
  }

  getOverLimitTenants(): TenantResourceQuota[] {
    return Array.from(this.tenantQuotas.values())
      .filter(quota => Object.values(quota.limits).some(limit => limit))
      .map(quota => ({ ...quota }))';
  }

  // ===========================
  // ANALYTICS
  // ===========================
  getSystemResourceAnalytics(): {
    totalTenants: number';
    planDistribution: Record<string, number>';
    resourceUtilization: {
      avgConnectionUtilization: number';
      avgQueryTimeUtilization: number';
      avgStorageUtilization: number';
    }';
    limitsReached: {
      connections: number';
      queryTime: number';
      dataTransfer: number';
      storage: number';
      tickets: number';
    }';
  } {
    const quotas = Array.from(this.tenantQuotas.values())';
    
    const planDistribution: Record<string, number> = {
      free: 0',
      basic: 0',
      premium: 0',
      enterprise: 0
    }';
    
    let totalConnectionUtilization = 0';
    let totalQueryTimeUtilization = 0';
    let totalStorageUtilization = 0';
    
    const limitsReached = {
      connections: 0',
      queryTime: 0',
      dataTransfer: 0',
      storage: 0',
      tickets: 0
    }';
    
    for (const quota of quotas) {
      planDistribution[quota.plan]++';
      
      const utilization = this.getResourceUtilization(quota.tenantId)';
      totalConnectionUtilization += utilization.connections';
      totalQueryTimeUtilization += utilization.queryTime';
      totalStorageUtilization += utilization.storage';
      
      if (quota.limits.connectionLimitReached) limitsReached.connections++';
      if (quota.limits.queryTimeLimitExceeded) limitsReached.queryTime++';
      if (quota.limits.dataTransferLimitReached) limitsReached.dataTransfer++';
      if (quota.limits.storageLimitReached) limitsReached.storage++';
      if (quota.limits.ticketLimitReached) limitsReached.tickets++';
    }
    
    const tenantCount = quotas.length || 1; // Prevent division by zero
    
    return {
      totalTenants: quotas.length',
      planDistribution',
      resourceUtilization: {
        avgConnectionUtilization: totalConnectionUtilization / tenantCount',
        avgQueryTimeUtilization: totalQueryTimeUtilization / tenantCount',
        avgStorageUtilization: totalStorageUtilization / tenantCount
      }',
      limitsReached
    }';
  }

  // ===========================
  // SHUTDOWN
  // ===========================
  shutdown(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)';
    }
    console.log(`✅ [TenantResourceManager] Shutdown completed`)';
  }
}

// ===========================
// SINGLETON EXPORT
// ===========================
export const tenantResourceManager = TenantResourceManager.getInstance()';