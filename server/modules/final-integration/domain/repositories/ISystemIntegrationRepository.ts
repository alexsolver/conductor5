/**
 * System Integration Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module ISystemIntegrationRepository
 * @created 2025-08-12 - Phase 25 Clean Architecture Implementation
 */

import { SystemIntegration, IntegrationStatus, ModuleIntegration, SystemHealthStatus } from '../entities/SystemIntegration';

export interface ISystemIntegrationRepository {
  // System Integration Management
  createIntegration(integration: Omit<SystemIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<SystemIntegration>;
  findById(id: string, tenantId: string): Promise<SystemIntegration | null>;
  findByTenant(tenantId: string): Promise<SystemIntegration[]>;
  updateIntegration(id: string, tenantId: string, updates: Partial<SystemIntegration>): Promise<SystemIntegration | null>;
  deleteIntegration(id: string, tenantId: string): Promise<boolean>;

  // Module Integration Management
  registerModule(integrationId: string, tenantId: string, module: ModuleIntegration): Promise<boolean>;
  updateModuleStatus(integrationId: string, tenantId: string, moduleName: string, status: any): Promise<boolean>;
  removeModule(integrationId: string, tenantId: string, moduleName: string): Promise<boolean>;
  getModuleStatus(integrationId: string, tenantId: string, moduleName: string): Promise<ModuleIntegration | null>;
  getAllModules(integrationId: string, tenantId: string): Promise<ModuleIntegration[]>;

  // Health Monitoring
  updateHealthStatus(integrationId: string, tenantId: string, healthStatus: SystemHealthStatus): Promise<boolean>;
  getHealthStatus(integrationId: string, tenantId: string): Promise<SystemHealthStatus | null>;
  recordHealthCheck(integrationId: string, tenantId: string, checkResults: any): Promise<boolean>;
  getHealthHistory(integrationId: string, tenantId: string, timeRange?: { startDate: Date; endDate: Date }): Promise<any[]>;

  // Performance Monitoring
  recordPerformanceMetrics(integrationId: string, tenantId: string, metrics: any): Promise<boolean>;
  getPerformanceMetrics(integrationId: string, tenantId: string, timeRange?: { startDate: Date; endDate: Date }): Promise<any>;
  getPerformanceTrends(integrationId: string, tenantId: string, metric: string, timeRange: { startDate: Date; endDate: Date }): Promise<any[]>;
  getPerformanceAlerts(integrationId: string, tenantId: string): Promise<any[]>;

  // Testing Integration
  recordTestResults(integrationId: string, tenantId: string, testResults: any): Promise<boolean>;
  getTestResults(integrationId: string, tenantId: string, testType?: string): Promise<any>;
  getTestCoverage(integrationId: string, tenantId: string): Promise<any>;
  getTestTrends(integrationId: string, tenantId: string, timeRange: { startDate: Date; endDate: Date }): Promise<any>;

  // Compliance Monitoring
  recordComplianceCheck(integrationId: string, tenantId: string, complianceResults: any): Promise<boolean>;
  getComplianceStatus(integrationId: string, tenantId: string): Promise<any>;
  getComplianceViolations(integrationId: string, tenantId: string, status?: string): Promise<any[]>;
  updateComplianceViolation(integrationId: string, tenantId: string, violationId: string, updates: any): Promise<boolean>;

  // Deployment Monitoring
  recordDeployment(integrationId: string, tenantId: string, deploymentInfo: any): Promise<boolean>;
  getDeploymentHistory(integrationId: string, tenantId: string, environment?: string): Promise<any[]>;
  getDeploymentStatus(integrationId: string, tenantId: string, deploymentId: string): Promise<any>;
  updateDeploymentStatus(integrationId: string, tenantId: string, deploymentId: string, status: string): Promise<boolean>;

  // Analytics and Reporting
  generateSystemReport(integrationId: string, tenantId: string, reportType: 'summary' | 'detailed' | 'health' | 'performance' | 'compliance'): Promise<any>;
  getSystemAnalytics(integrationId: string, tenantId: string, timeRange: { startDate: Date; endDate: Date }): Promise<any>;
  getIntegrationMetrics(integrationId: string, tenantId: string): Promise<any>;
  getSystemTrends(integrationId: string, tenantId: string, metric: string, timeRange: { startDate: Date; endDate: Date }): Promise<any>;

  // Incident Management
  recordIncident(integrationId: string, tenantId: string, incident: any): Promise<string>;
  updateIncident(integrationId: string, tenantId: string, incidentId: string, updates: any): Promise<boolean>;
  getIncidents(integrationId: string, tenantId: string, status?: string): Promise<any[]>;
  getIncidentHistory(integrationId: string, tenantId: string, timeRange: { startDate: Date; endDate: Date }): Promise<any[]>;

  // Maintenance Management
  scheduleMaintenanceWindow(integrationId: string, tenantId: string, maintenance: any): Promise<string>;
  updateMaintenanceWindow(integrationId: string, tenantId: string, maintenanceId: string, updates: any): Promise<boolean>;
  getMaintenanceWindows(integrationId: string, tenantId: string, status?: string): Promise<any[]>;
  getMaintenanceHistory(integrationId: string, tenantId: string): Promise<any[]>;

  // Dependency Management
  updateDependencies(integrationId: string, tenantId: string, moduleName: string, dependencies: any[]): Promise<boolean>;
  getDependencies(integrationId: string, tenantId: string, moduleName?: string): Promise<any>;
  validateDependencies(integrationId: string, tenantId: string): Promise<any>;
  getDependencyGraph(integrationId: string, tenantId: string): Promise<any>;

  // Configuration Management
  updateConfiguration(integrationId: string, tenantId: string, configuration: any): Promise<boolean>;
  getConfiguration(integrationId: string, tenantId: string): Promise<any>;
  validateConfiguration(integrationId: string, tenantId: string): Promise<any>;
  getConfigurationHistory(integrationId: string, tenantId: string): Promise<any[]>;

  // Monitoring and Alerting
  createAlert(integrationId: string, tenantId: string, alert: any): Promise<string>;
  updateAlert(integrationId: string, tenantId: string, alertId: string, updates: any): Promise<boolean>;
  getAlerts(integrationId: string, tenantId: string, status?: string): Promise<any[]>;
  triggerAlert(integrationId: string, tenantId: string, alertId: string, data: any): Promise<boolean>;

  // Documentation Management
  updateDocumentation(integrationId: string, tenantId: string, moduleName: string, documentation: any): Promise<boolean>;
  getDocumentation(integrationId: string, tenantId: string, moduleName?: string): Promise<any>;
  validateDocumentation(integrationId: string, tenantId: string): Promise<any>;
  getDocumentationCoverage(integrationId: string, tenantId: string): Promise<any>;

  // Security Monitoring
  recordSecurityEvent(integrationId: string, tenantId: string, event: any): Promise<boolean>;
  getSecurityEvents(integrationId: string, tenantId: string, timeRange: { startDate: Date; endDate: Date }): Promise<any[]>;
  getSecurityStatus(integrationId: string, tenantId: string): Promise<any>;
  updateSecurityConfiguration(integrationId: string, tenantId: string, configuration: any): Promise<boolean>;

  // Backup and Recovery
  createBackup(integrationId: string, tenantId: string, backupConfig: any): Promise<string>;
  getBackups(integrationId: string, tenantId: string): Promise<any[]>;
  restoreFromBackup(integrationId: string, tenantId: string, backupId: string): Promise<boolean>;
  validateBackupIntegrity(integrationId: string, tenantId: string, backupId: string): Promise<boolean>;

  // Capacity Planning
  recordCapacityMetrics(integrationId: string, tenantId: string, metrics: any): Promise<boolean>;
  getCapacityMetrics(integrationId: string, tenantId: string): Promise<any>;
  getCapacityForecast(integrationId: string, tenantId: string, timeframe: number): Promise<any>;
  getCapacityRecommendations(integrationId: string, tenantId: string): Promise<any[]>;

  // Audit and Logging
  recordAuditEvent(integrationId: string, tenantId: string, event: any): Promise<boolean>;
  getAuditLog(integrationId: string, tenantId: string, timeRange: { startDate: Date; endDate: Date }): Promise<any[]>;
  searchAuditLog(integrationId: string, tenantId: string, query: string, timeRange: { startDate: Date; endDate: Date }): Promise<any[]>;
  exportAuditLog(integrationId: string, tenantId: string, timeRange: { startDate: Date; endDate: Date }, format: string): Promise<string>;

  // Integration Testing
  runIntegrationTests(integrationId: string, tenantId: string, testSuite?: string): Promise<any>;
  getIntegrationTestResults(integrationId: string, tenantId: string): Promise<any>;
  scheduleIntegrationTests(integrationId: string, tenantId: string, schedule: any): Promise<boolean>;
  validateIntegrationHealth(integrationId: string, tenantId: string): Promise<any>;

  // API Management
  registerEndpoint(integrationId: string, tenantId: string, moduleName: string, endpoint: any): Promise<boolean>;
  updateEndpoint(integrationId: string, tenantId: string, moduleName: string, endpointPath: string, updates: any): Promise<boolean>;
  getEndpoints(integrationId: string, tenantId: string, moduleName?: string): Promise<any[]>;
  getEndpointMetrics(integrationId: string, tenantId: string, endpointPath: string): Promise<any>;

  // Version Management
  recordVersionDeployment(integrationId: string, tenantId: string, moduleName: string, version: string): Promise<boolean>;
  getVersionHistory(integrationId: string, tenantId: string, moduleName?: string): Promise<any[]>;
  compareVersions(integrationId: string, tenantId: string, moduleName: string, version1: string, version2: string): Promise<any>;
  rollbackToVersion(integrationId: string, tenantId: string, moduleName: string, version: string): Promise<boolean>;

  // Resource Management
  allocateResources(integrationId: string, tenantId: string, moduleName: string, resources: any): Promise<boolean>;
  deallocateResources(integrationId: string, tenantId: string, moduleName: string, resources: any): Promise<boolean>;
  getResourceUsage(integrationId: string, tenantId: string, moduleName?: string): Promise<any>;
  optimizeResourceAllocation(integrationId: string, tenantId: string): Promise<any>;

  // Load Balancing and Scaling
  updateScalingConfiguration(integrationId: string, tenantId: string, moduleName: string, config: any): Promise<boolean>;
  getScalingStatus(integrationId: string, tenantId: string, moduleName: string): Promise<any>;
  triggerScaling(integrationId: string, tenantId: string, moduleName: string, direction: 'up' | 'down'): Promise<boolean>;
  getScalingHistory(integrationId: string, tenantId: string, moduleName: string): Promise<any[]>;

  // Network Management
  updateNetworkConfiguration(integrationId: string, tenantId: string, config: any): Promise<boolean>;
  getNetworkStatus(integrationId: string, tenantId: string): Promise<any>;
  validateNetworkConnectivity(integrationId: string, tenantId: string): Promise<any>;
  getNetworkMetrics(integrationId: string, tenantId: string): Promise<any>;

  // Database Management
  updateDatabaseConfiguration(integrationId: string, tenantId: string, config: any): Promise<boolean>;
  getDatabaseStatus(integrationId: string, tenantId: string): Promise<any>;
  validateDatabaseConnections(integrationId: string, tenantId: string): Promise<any>;
  getDatabaseMetrics(integrationId: string, tenantId: string): Promise<any>;

  // Cache Management
  updateCacheConfiguration(integrationId: string, tenantId: string, config: any): Promise<boolean>;
  getCacheStatus(integrationId: string, tenantId: string): Promise<any>;
  clearCache(integrationId: string, tenantId: string, cacheType?: string): Promise<boolean>;
  getCacheMetrics(integrationId: string, tenantId: string): Promise<any>;

  // Message Queue Management
  updateQueueConfiguration(integrationId: string, tenantId: string, config: any): Promise<boolean>;
  getQueueStatus(integrationId: string, tenantId: string): Promise<any>;
  getQueueMetrics(integrationId: string, tenantId: string): Promise<any>;
  purgeQueue(integrationId: string, tenantId: string, queueName: string): Promise<boolean>;

  // Service Discovery
  registerService(integrationId: string, tenantId: string, service: any): Promise<boolean>;
  deregisterService(integrationId: string, tenantId: string, serviceName: string): Promise<boolean>;
  getServiceRegistry(integrationId: string, tenantId: string): Promise<any[]>;
  validateServiceHealth(integrationId: string, tenantId: string, serviceName: string): Promise<any>;

  // Circuit Breaker Management
  updateCircuitBreakerConfiguration(integrationId: string, tenantId: string, config: any): Promise<boolean>;
  getCircuitBreakerStatus(integrationId: string, tenantId: string): Promise<any>;
  resetCircuitBreaker(integrationId: string, tenantId: string, breakerName: string): Promise<boolean>;
  getCircuitBreakerMetrics(integrationId: string, tenantId: string): Promise<any>;

  // Rate Limiting
  updateRateLimitConfiguration(integrationId: string, tenantId: string, config: any): Promise<boolean>;
  getRateLimitStatus(integrationId: string, tenantId: string): Promise<any>;
  getRateLimitMetrics(integrationId: string, tenantId: string): Promise<any>;
  resetRateLimit(integrationId: string, tenantId: string, limitName: string): Promise<boolean>;

  // Feature Flag Management
  updateFeatureFlags(integrationId: string, tenantId: string, flags: any): Promise<boolean>;
  getFeatureFlags(integrationId: string, tenantId: string): Promise<any>;
  toggleFeatureFlag(integrationId: string, tenantId: string, flagName: string, enabled: boolean): Promise<boolean>;
  getFeatureFlagUsage(integrationId: string, tenantId: string): Promise<any>;

  // Environment Management
  createEnvironment(integrationId: string, tenantId: string, environment: any): Promise<string>;
  updateEnvironment(integrationId: string, tenantId: string, environmentId: string, updates: any): Promise<boolean>;
  getEnvironments(integrationId: string, tenantId: string): Promise<any[]>;
  promoteToEnvironment(integrationId: string, tenantId: string, sourceEnv: string, targetEnv: string): Promise<boolean>;

  // Workflow Management
  createWorkflow(integrationId: string, tenantId: string, workflow: any): Promise<string>;
  executeWorkflow(integrationId: string, tenantId: string, workflowId: string, parameters?: any): Promise<string>;
  getWorkflowStatus(integrationId: string, tenantId: string, executionId: string): Promise<any>;
  getWorkflowHistory(integrationId: string, tenantId: string, workflowId: string): Promise<any[]>;

  // Health Checks
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail';
      duration: number;
      message?: string;
    }>;
    metrics: {
      responseTime: number;
      throughput: number;
      errorRate: number;
      storageUsage: number;
    };
    recommendations: string[];
  }>;

  // System Metrics
  getSystemMetrics(): Promise<{
    totalIntegrations: number;
    activeIntegrations: number;
    totalModules: number;
    healthyModules: number;
    averageUptime: number;
    systemLoad: number;
    integrationsByStatus: Record<IntegrationStatus, number>;
    modulesByPhase: Record<number, number>;
  }>;
}