/**
 * Template Audit Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module ITemplateAuditRepository
 * @created 2025-08-12 - Phase 23 Clean Architecture Implementation
 */

import { TemplateAudit, AuditType, AuditAction, TemplateType, AuditCategory, ComplianceViolation } from '../entities/TemplateAudit';

export interface ITemplateAuditRepository {
  // Basic CRUD Operations
  create(audit: Omit<TemplateAudit, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemplateAudit>;
  findById(id: string, tenantId: string): Promise<TemplateAudit | null>;
  update(id: string, tenantId: string, updates: Partial<TemplateAudit>): Promise<TemplateAudit | null>;
  delete(id: string, tenantId: string): Promise<boolean>;

  // Query Operations
  findAll(tenantId: string, filters?: {
    templateId?: string;
    templateType?: TemplateType;
    auditType?: AuditType;
    action?: AuditAction;
    userId?: string;
    category?: AuditCategory;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TemplateAudit[]>;

  findByTemplate(tenantId: string, templateId: string, filters?: {
    auditType?: AuditType;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TemplateAudit[]>;

  findByUser(tenantId: string, userId: string, filters?: {
    templateType?: TemplateType;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TemplateAudit[]>;

  findByDateRange(tenantId: string, startDate: Date, endDate: Date, filters?: {
    templateType?: TemplateType;
    auditType?: AuditType;
    severity?: string;
  }): Promise<TemplateAudit[]>;

  findRecent(tenantId: string, limit?: number, filters?: {
    templateType?: TemplateType;
    severity?: string;
  }): Promise<TemplateAudit[]>;

  // Search Operations
  search(tenantId: string, query: string, filters?: {
    templateType?: TemplateType;
    auditType?: AuditType;
    category?: AuditCategory;
  }): Promise<TemplateAudit[]>;

  searchByContent(tenantId: string, content: string, filters?: {
    field?: string;
    changeType?: string;
  }): Promise<TemplateAudit[]>;

  // Analytics and Reporting
  getAuditSummary(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalAudits: number;
    auditsByType: Record<string, number>;
    auditsByAction: Record<string, number>;
    auditsByUser: Record<string, number>;
    auditsBySeverity: Record<string, number>;
    topTemplates: Array<{
      templateId: string;
      templateType: string;
      auditCount: number;
      lastActivity: Date;
    }>;
    riskDistribution: Record<string, number>;
    trends: Array<{
      date: string;
      count: number;
      riskScore: number;
    }>;
  }>;

  getTemplateAuditHistory(tenantId: string, templateId: string): Promise<{
    timeline: Array<{
      timestamp: Date;
      action: string;
      user: string;
      description: string;
      changes: number;
      riskScore: number;
    }>;
    statistics: {
      totalChanges: number;
      uniqueUsers: number;
      averageRiskScore: number;
      lastModified: Date;
      creationDate: Date;
    };
    changeFrequency: Record<string, number>;
    userActivity: Record<string, number>;
  }>;

  getUserAuditActivity(tenantId: string, userId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalAudits: number;
    actionBreakdown: Record<string, number>;
    templateTypes: Record<string, number>;
    riskProfile: {
      averageRisk: number;
      highRiskActions: number;
      riskTrend: string;
    };
    timeline: Array<{
      date: string;
      actions: number;
      riskScore: number;
    }>;
    patterns: Array<{
      pattern: string;
      frequency: number;
      riskLevel: string;
    }>;
  }>;

  // Risk Analysis
  getRiskAnalysis(tenantId: string, filters?: {
    templateType?: TemplateType;
    timeRange?: {
      startDate: Date;
      endDate: Date;
    };
  }): Promise<{
    overallRisk: number;
    riskFactors: Array<{
      factor: string;
      impact: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    highRiskAudits: TemplateAudit[];
    recommendations: Array<{
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      description: string;
      action: string;
    }>;
    trends: Array<{
      period: string;
      riskScore: number;
      auditCount: number;
    }>;
  }>;

  getAnomalyDetection(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    anomalies: Array<{
      id: string;
      type: 'unusual_activity' | 'pattern_break' | 'volume_spike' | 'risk_elevation';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      timestamp: Date;
      relatedAudits: string[];
      confidence: number;
    }>;
    patterns: Array<{
      pattern: string;
      baseline: number;
      current: number;
      deviation: number;
    }>;
    recommendations: string[];
  }>;

  // Compliance Operations
  getComplianceReport(tenantId: string, standards: string[], timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    overallCompliance: number;
    standardsCompliance: Record<string, {
      status: 'compliant' | 'non_compliant' | 'partial';
      score: number;
      violations: ComplianceViolation[];
      requirements: Array<{
        requirement: string;
        status: 'met' | 'not_met' | 'partial';
        evidence: string[];
      }>;
    }>;
    violations: ComplianceViolation[];
    recommendations: Array<{
      standard: string;
      priority: string;
      description: string;
      action: string;
      dueDate?: Date;
    }>;
    trends: Array<{
      period: string;
      compliance: number;
      violations: number;
    }>;
  }>;

  validateCompliance(tenantId: string, auditId: string, standards: string[]): Promise<{
    compliant: boolean;
    violations: ComplianceViolation[];
    requirements: string[];
    recommendations: string[];
    score: number;
  }>;

  getRetentionStatus(tenantId: string): Promise<{
    totalRecords: number;
    eligibleForArchive: number;
    eligibleForDeletion: number;
    retentionPolicies: Array<{
      policy: string;
      applicableRecords: number;
      nextArchiveDate: Date;
      nextDeletionDate: Date;
    }>;
    storageImpact: {
      currentSize: number;
      projectedReduction: number;
      costSavings: number;
    };
  }>;

  // Chain Integrity
  validateChainIntegrity(tenantId: string, templateId?: string): Promise<{
    valid: boolean;
    totalRecords: number;
    validRecords: number;
    brokenChains: Array<{
      auditId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    recommendations: string[];
    lastValidation: Date;
  }>;

  repairChainIntegrity(tenantId: string, auditIds: string[]): Promise<{
    repaired: number;
    failed: number;
    errors: Array<{
      auditId: string;
      error: string;
    }>;
    newHashes: Record<string, string>;
  }>;

  generateIntegrityReport(tenantId: string): Promise<{
    status: 'valid' | 'compromised' | 'partially_valid';
    score: number;
    totalAudits: number;
    validAudits: number;
    issues: Array<{
      type: string;
      count: number;
      severity: string;
    }>;
    recommendations: string[];
    lastCheck: Date;
  }>;

  // Export and Import
  exportAudits(tenantId: string, filters: {
    templateId?: string;
    startDate?: Date;
    endDate?: Date;
    format: 'json' | 'csv' | 'xml' | 'pdf';
    includeMetadata?: boolean;
    includeChanges?: boolean;
  }): Promise<{
    exportId: string;
    downloadUrl: string;
    fileSize: number;
    recordCount: number;
    format: string;
    expiresAt: Date;
  }>;

  importAudits(tenantId: string, data: any, options?: {
    validateIntegrity?: boolean;
    mergeStrategy?: 'append' | 'replace' | 'merge';
    dryRun?: boolean;
  }): Promise<{
    success: boolean;
    imported: number;
    skipped: number;
    errors: number;
    warnings: string[];
    validationResults?: {
      valid: boolean;
      issues: string[];
    };
  }>;

  // Archive Operations
  archiveAudits(tenantId: string, criteria: {
    olderThan?: Date;
    templateIds?: string[];
    statuses?: string[];
    dryRun?: boolean;
  }): Promise<{
    archived: number;
    skipped: number;
    errors: number;
    archiveLocation: string;
    archiveSize: number;
    estimatedSavings: number;
  }>;

  restoreFromArchive(tenantId: string, archiveId: string, filters?: {
    templateIds?: string[];
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
  }): Promise<{
    restored: number;
    skipped: number;
    errors: number;
    restoredAudits: string[];
  }>;

  getArchiveStatus(tenantId: string): Promise<{
    archives: Array<{
      archiveId: string;
      createdAt: Date;
      recordCount: number;
      size: number;
      status: 'available' | 'archived' | 'expired';
      expiresAt?: Date;
    }>;
    totalArchived: number;
    totalSize: number;
    storageLocation: string;
  }>;

  // Monitoring and Alerts
  createAuditAlert(tenantId: string, alert: {
    name: string;
    description: string;
    conditions: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
    actions: Array<{
      type: 'email' | 'webhook' | 'notification';
      configuration: any;
    }>;
    enabled: boolean;
  }): Promise<{
    alertId: string;
    status: string;
  }>;

  getAuditAlerts(tenantId: string): Promise<Array<{
    alertId: string;
    name: string;
    description: string;
    enabled: boolean;
    lastTriggered?: Date;
    triggerCount: number;
    conditions: any[];
    actions: any[];
  }>>;

  triggerAlert(tenantId: string, alertId: string, audit: TemplateAudit): Promise<{
    triggered: boolean;
    actions: Array<{
      type: string;
      status: 'success' | 'failed';
      error?: string;
    }>;
  }>;

  // Performance Operations
  getPerformanceMetrics(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    averageProcessingTime: number;
    totalProcessingTime: number;
    throughput: number;
    peakLoad: {
      timestamp: Date;
      auditsPerSecond: number;
    };
    bottlenecks: Array<{
      component: string;
      averageTime: number;
      impact: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
  }>;

  optimizePerformance(tenantId: string): Promise<{
    optimizations: Array<{
      type: string;
      description: string;
      estimatedImprovement: number;
      implemented: boolean;
    }>;
    beforeMetrics: any;
    afterMetrics?: any;
  }>;

  // Bulk Operations
  bulkCreateAudits(audits: Omit<TemplateAudit, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{
    created: number;
    failed: number;
    errors: Array<{
      index: number;
      error: string;
    }>;
    auditIds: string[];
  }>;

  bulkUpdateAudits(updates: Array<{
    id: string;
    tenantId: string;
    updates: Partial<TemplateAudit>;
  }>): Promise<{
    updated: number;
    failed: number;
    errors: Array<{
      id: string;
      error: string;
    }>;
  }>;

  bulkDeleteAudits(ids: string[], tenantId: string): Promise<{
    deleted: number;
    failed: number;
    errors: Array<{
      id: string;
      error: string;
    }>;
  }>;

  // Statistics and Metrics
  getStatistics(tenantId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalAudits: number;
    auditGrowthRate: number;
    averageRiskScore: number;
    complianceScore: number;
    topUsers: Array<{
      userId: string;
      userName: string;
      auditCount: number;
      riskScore: number;
    }>;
    topTemplates: Array<{
      templateId: string;
      templateType: string;
      auditCount: number;
      riskScore: number;
    }>;
    activityDistribution: Record<string, number>;
    healthMetrics: {
      integrityScore: number;
      completenessScore: number;
      timelinessScore: number;
    };
  }>;

  // Health Check
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warn';
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
}