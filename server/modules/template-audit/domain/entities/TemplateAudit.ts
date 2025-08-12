/**
 * Template Audit Domain Entity
 * Clean Architecture - Domain Layer
 * 
 * @module TemplateAuditEntity
 * @created 2025-08-12 - Phase 23 Clean Architecture Implementation
 */

export interface TemplateAudit {
  id: string;
  tenantId: string;
  templateId: string;
  templateType: TemplateType;
  auditType: AuditType;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  userRole: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: AuditDetails;
  changes: AuditChange[];
  metadata: AuditMetadata;
  status: 'pending' | 'processed' | 'failed' | 'archived';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: AuditCategory;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateType = 
  | 'email_template'
  | 'document_template'
  | 'field_layout'
  | 'report_template'
  | 'workflow_template'
  | 'notification_template'
  | 'automation_template'
  | 'approval_template'
  | 'escalation_template'
  | 'system_template';

export type AuditType = 
  | 'creation'
  | 'modification'
  | 'deletion'
  | 'access'
  | 'deployment'
  | 'rollback'
  | 'export'
  | 'import'
  | 'clone'
  | 'activation'
  | 'deactivation'
  | 'permission_change'
  | 'configuration_change'
  | 'compliance_check';

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'deploy'
  | 'activate'
  | 'deactivate'
  | 'clone'
  | 'export'
  | 'import'
  | 'share'
  | 'unshare'
  | 'approve'
  | 'reject'
  | 'rollback'
  | 'archive'
  | 'restore'
  | 'validate'
  | 'test'
  | 'publish'
  | 'unpublish';

export type EntityType = 
  | 'template'
  | 'field'
  | 'section'
  | 'workflow'
  | 'rule'
  | 'condition'
  | 'action'
  | 'permission'
  | 'configuration'
  | 'variable'
  | 'attachment'
  | 'metadata';

export type AuditCategory = 
  | 'security'
  | 'compliance'
  | 'performance'
  | 'data_integrity'
  | 'user_activity'
  | 'system_activity'
  | 'configuration'
  | 'deployment'
  | 'maintenance'
  | 'monitoring';

export interface AuditDetails {
  description: string;
  reason?: string;
  source: AuditSource;
  context: AuditContext;
  impact: AuditImpact;
  validation: AuditValidation;
  compliance: ComplianceInfo;
  performance: PerformanceInfo;
  security: SecurityInfo;
}

export interface AuditSource {
  type: 'web_ui' | 'api' | 'automation' | 'system' | 'integration' | 'migration';
  application: string;
  component: string;
  version: string;
  buildId?: string;
  deploymentId?: string;
}

export interface AuditContext {
  requestId: string;
  correlationId?: string;
  transactionId?: string;
  workflowId?: string;
  batchId?: string;
  parentAuditId?: string;
  relatedAuditIds: string[];
  environment: 'development' | 'staging' | 'production';
  feature: string;
  module: string;
}

export interface AuditImpact {
  scope: 'single' | 'multiple' | 'system_wide' | 'tenant_wide';
  affectedEntities: string[];
  affectedUsers: string[];
  affectedTenants: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  technicalImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
}

export interface AuditValidation {
  isValid: boolean;
  validatedAt: Date;
  validatedBy: string;
  validationRules: ValidationRule[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'syntax' | 'semantic' | 'security' | 'compliance' | 'performance' | 'business';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message?: string;
  details?: any;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
  expected?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  recommendation?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  value?: any;
  severity: 'low' | 'medium' | 'high';
  category: string;
  recommendation?: string;
}

export interface ComplianceInfo {
  standards: ComplianceStandard[];
  violations: ComplianceViolation[];
  certifications: string[];
  requirements: string[];
  exemptions: ComplianceExemption[];
  assessmentDate?: Date;
  assessmentBy?: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending_review';
}

export interface ComplianceStandard {
  name: string;
  version: string;
  type: 'regulation' | 'industry' | 'internal' | 'certification';
  status: 'applicable' | 'not_applicable' | 'pending';
  compliance: 'compliant' | 'non_compliant' | 'partial';
  requirements: string[];
  violations: string[];
}

export interface ComplianceViolation {
  standard: string;
  requirement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  dueDate?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
}

export interface ComplianceExemption {
  standard: string;
  requirement: string;
  reason: string;
  approvedBy: string;
  approvedAt: Date;
  expiresAt?: Date;
  conditions: string[];
}

export interface PerformanceInfo {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkCalls: number;
  databaseQueries: number;
  cacheHits: number;
  cacheMisses: number;
  warnings: PerformanceWarning[];
  recommendations: string[];
}

export interface PerformanceWarning {
  type: 'slow_execution' | 'high_memory' | 'excessive_queries' | 'cache_misses' | 'resource_intensive';
  threshold: number;
  actual: number;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface SecurityInfo {
  permissions: PermissionInfo[];
  threats: SecurityThreat[];
  vulnerabilities: SecurityVulnerability[];
  controls: SecurityControl[];
  classifications: DataClassification[];
  encryption: EncryptionInfo;
}

export interface PermissionInfo {
  type: 'granted' | 'denied' | 'inherited' | 'temporary';
  principal: string;
  principalType: 'user' | 'role' | 'group' | 'service';
  resource: string;
  action: string;
  condition?: string;
  grantedBy?: string;
  grantedAt?: Date;
  expiresAt?: Date;
}

export interface SecurityThreat {
  type: 'unauthorized_access' | 'data_exposure' | 'privilege_escalation' | 'injection' | 'tampering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: string[];
  mitigation: string;
  status: 'detected' | 'mitigated' | 'resolved' | 'false_positive';
}

export interface SecurityVulnerability {
  id: string;
  type: 'code' | 'configuration' | 'dependency' | 'design' | 'operational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'fixed' | 'accepted_risk';
  cvss?: number;
  cve?: string;
}

export interface SecurityControl {
  type: 'preventive' | 'detective' | 'corrective' | 'deterrent';
  name: string;
  description: string;
  effectiveness: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'bypassed' | 'failed';
  lastTested?: Date;
  testResult?: 'passed' | 'failed' | 'partial';
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
  categories: string[];
  handling: string[];
  retention: string;
  disposal: string;
  access: string[];
}

export interface EncryptionInfo {
  inTransit: boolean;
  atRest: boolean;
  algorithm: string;
  keyLength: number;
  keyRotation: boolean;
  compliance: string[];
}

export interface AuditChange {
  id: string;
  field: string;
  fieldType: 'primitive' | 'object' | 'array' | 'reference';
  operation: 'create' | 'update' | 'delete' | 'move' | 'copy';
  path: string;
  oldValue: any;
  newValue: any;
  changeType: ChangeType;
  impact: ChangeImpact;
  validation: ChangeValidation;
  metadata: ChangeMetadata;
}

export type ChangeType = 
  | 'addition'
  | 'modification'
  | 'removal'
  | 'restructure'
  | 'migration'
  | 'optimization'
  | 'security_fix'
  | 'bug_fix'
  | 'feature_enhancement'
  | 'configuration_change';

export interface ChangeImpact {
  breaking: boolean;
  backward_compatible: boolean;
  performance_impact: 'positive' | 'negative' | 'neutral';
  security_impact: 'improved' | 'degraded' | 'neutral';
  user_impact: 'positive' | 'negative' | 'neutral';
  system_impact: 'low' | 'medium' | 'high';
  dependencies: string[];
}

export interface ChangeValidation {
  syntax_valid: boolean;
  semantically_valid: boolean;
  business_rules_valid: boolean;
  security_validated: boolean;
  performance_tested: boolean;
  compatibility_checked: boolean;
  errors: string[];
  warnings: string[];
}

export interface ChangeMetadata {
  size: number;
  complexity: 'low' | 'medium' | 'high';
  confidence: number;
  automated: boolean;
  reviewed: boolean;
  approved: boolean;
  rolled_back: boolean;
  rollback_reason?: string;
}

export interface AuditMetadata {
  version: string;
  schema_version: string;
  processor_version: string;
  processed_at?: Date;
  processed_by?: string;
  retention_policy: RetentionPolicy;
  archive_info?: ArchiveInfo;
  export_info?: ExportInfo;
  hash: string;
  checksum: string;
  digital_signature?: string;
  chain_hash?: string;
}

export interface RetentionPolicy {
  retain_days: number;
  archive_after_days: number;
  delete_after_days: number;
  legal_hold: boolean;
  compliance_requirements: string[];
  auto_archive: boolean;
  auto_delete: boolean;
}

export interface ArchiveInfo {
  archived_at: Date;
  archived_by: string;
  archive_location: string;
  archive_format: string;
  archive_size: number;
  archive_checksum: string;
  retrieval_time?: Date;
}

export interface ExportInfo {
  exported_at: Date;
  exported_by: string;
  export_format: string;
  export_size: number;
  export_location: string;
  export_purpose: string;
  retention_period?: number;
}

/**
 * Template Audit Business Rules and Domain Service
 */
export class TemplateAuditDomainService {
  
  /**
   * Validate audit entry
   */
  static validateAuditEntry(audit: Partial<TemplateAudit>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!audit.templateId) errors.push('Template ID is required');
    if (!audit.templateType) errors.push('Template type is required');
    if (!audit.auditType) errors.push('Audit type is required');
    if (!audit.action) errors.push('Action is required');
    if (!audit.userId) errors.push('User ID is required');
    if (!audit.tenantId) errors.push('Tenant ID is required');

    // Action-specific validation
    if (audit.action === 'delete' && !audit.details?.reason) {
      warnings.push('Deletion reason is recommended for audit trails');
    }

    if (audit.action === 'update' && (!audit.changes || audit.changes.length === 0)) {
      errors.push('Changes are required for update actions');
    }

    // Security validation
    if (audit.details?.security && audit.details.security.threats.length > 0) {
      if (audit.severity !== 'high' && audit.severity !== 'critical') {
        warnings.push('Security threats detected but severity is not elevated');
      }
    }

    // Compliance validation
    if (audit.details?.compliance?.violations.length > 0) {
      const criticalViolations = audit.details.compliance.violations.filter(v => v.severity === 'critical');
      if (criticalViolations.length > 0 && audit.severity !== 'critical') {
        warnings.push('Critical compliance violations detected but severity is not critical');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Calculate audit risk score
   */
  static calculateRiskScore(audit: TemplateAudit): {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: Array<{ factor: string; score: number; weight: number }>;
  } {
    const factors = [
      {
        factor: 'Action Risk',
        score: this.getActionRiskScore(audit.action),
        weight: 0.3
      },
      {
        factor: 'Security Impact',
        score: this.getSecurityScore(audit.details.security),
        weight: 0.25
      },
      {
        factor: 'Compliance Impact',
        score: this.getComplianceScore(audit.details.compliance),
        weight: 0.2
      },
      {
        factor: 'Change Impact',
        score: this.getChangeImpactScore(audit.changes),
        weight: 0.15
      },
      {
        factor: 'User Risk',
        score: this.getUserRiskScore(audit.userRole),
        weight: 0.1
      }
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    let level: 'low' | 'medium' | 'high' | 'critical';
    if (weightedScore >= 80) level = 'critical';
    else if (weightedScore >= 60) level = 'high';
    else if (weightedScore >= 40) level = 'medium';
    else level = 'low';

    return { score: Math.round(weightedScore), level, factors };
  }

  private static getActionRiskScore(action: AuditAction): number {
    const riskMap: Record<AuditAction, number> = {
      'delete': 90,
      'unpublish': 80,
      'deactivate': 70,
      'update': 60,
      'deploy': 60,
      'activate': 50,
      'publish': 50,
      'clone': 40,
      'export': 40,
      'create': 30,
      'import': 50,
      'share': 30,
      'unshare': 20,
      'approve': 20,
      'reject': 30,
      'rollback': 70,
      'archive': 40,
      'restore': 50,
      'validate': 10,
      'test': 10,
      'read': 10
    };

    return riskMap[action] || 50;
  }

  private static getSecurityScore(security: SecurityInfo): number {
    let score = 0;

    // Threats
    security.threats.forEach(threat => {
      switch (threat.severity) {
        case 'critical': score += 25; break;
        case 'high': score += 15; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
    });

    // Vulnerabilities
    security.vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': score += 20; break;
        case 'high': score += 12; break;
        case 'medium': score += 8; break;
        case 'low': score += 4; break;
      }
    });

    return Math.min(score, 100);
  }

  private static getComplianceScore(compliance: ComplianceInfo): number {
    let score = 0;

    compliance.violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical': score += 30; break;
        case 'high': score += 20; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
    });

    if (compliance.status === 'non_compliant') score += 50;
    else if (compliance.status === 'partial') score += 25;

    return Math.min(score, 100);
  }

  private static getChangeImpactScore(changes: AuditChange[]): number {
    let score = 0;

    changes.forEach(change => {
      if (change.impact.breaking) score += 30;
      if (!change.impact.backward_compatible) score += 20;
      
      switch (change.impact.system_impact) {
        case 'high': score += 15; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }

      if (change.metadata.complexity === 'high') score += 10;
    });

    return Math.min(score, 100);
  }

  private static getUserRiskScore(userRole: string): number {
    const roleRiskMap: Record<string, number> = {
      'saas_admin': 90,
      'tenant_admin': 70,
      'admin': 60,
      'manager': 50,
      'user': 30,
      'viewer': 10,
      'guest': 5
    };

    return roleRiskMap[userRole] || 50;
  }

  /**
   * Generate audit summary
   */
  static generateAuditSummary(audits: TemplateAudit[]): {
    totalAudits: number;
    auditsByType: Record<string, number>;
    auditsByAction: Record<string, number>;
    auditsByUser: Record<string, number>;
    riskDistribution: Record<string, number>;
    timeDistribution: Record<string, number>;
    topRisks: Array<{ audit: TemplateAudit; riskScore: number }>;
    trends: Array<{ period: string; count: number; risk: number }>;
  } {
    const summary = {
      totalAudits: audits.length,
      auditsByType: {} as Record<string, number>,
      auditsByAction: {} as Record<string, number>,
      auditsByUser: {} as Record<string, number>,
      riskDistribution: {} as Record<string, number>,
      timeDistribution: {} as Record<string, number>,
      topRisks: [] as Array<{ audit: TemplateAudit; riskScore: number }>,
      trends: [] as Array<{ period: string; count: number; risk: number }>
    };

    audits.forEach(audit => {
      // Count by type
      summary.auditsByType[audit.auditType] = (summary.auditsByType[audit.auditType] || 0) + 1;
      
      // Count by action
      summary.auditsByAction[audit.action] = (summary.auditsByAction[audit.action] || 0) + 1;
      
      // Count by user
      summary.auditsByUser[audit.userName] = (summary.auditsByUser[audit.userName] || 0) + 1;
      
      // Risk distribution
      const riskData = this.calculateRiskScore(audit);
      summary.riskDistribution[riskData.level] = (summary.riskDistribution[riskData.level] || 0) + 1;
      
      // Time distribution (by day)
      const day = audit.timestamp.toISOString().split('T')[0];
      summary.timeDistribution[day] = (summary.timeDistribution[day] || 0) + 1;
      
      // Top risks
      summary.topRisks.push({ audit, riskScore: riskData.score });
    });

    // Sort top risks
    summary.topRisks.sort((a, b) => b.riskScore - a.riskScore);
    summary.topRisks = summary.topRisks.slice(0, 10);

    return summary;
  }

  /**
   * Check compliance requirements
   */
  static checkComplianceRequirements(audit: TemplateAudit, requirements: string[]): {
    compliant: boolean;
    missing: string[];
    violations: ComplianceViolation[];
    recommendations: string[];
  } {
    const missing: string[] = [];
    const violations: ComplianceViolation[] = [];
    const recommendations: string[] = [];

    requirements.forEach(requirement => {
      switch (requirement) {
        case 'audit_trail':
          if (!audit.details.description) {
            missing.push('Audit trail description');
            violations.push({
              standard: 'SOX',
              requirement: 'audit_trail',
              severity: 'high',
              description: 'Audit trail must include detailed description',
              recommendation: 'Add detailed description to audit entry',
              status: 'open'
            });
          }
          break;

        case 'change_approval':
          if (audit.action === 'update' && !audit.details.validation.validatedBy) {
            missing.push('Change approval');
            violations.push({
              standard: 'ITIL',
              requirement: 'change_approval',
              severity: 'medium',
              description: 'Changes must be approved before implementation',
              recommendation: 'Implement change approval workflow',
              status: 'open'
            });
          }
          break;

        case 'data_retention':
          if (!audit.metadata.retention_policy) {
            missing.push('Data retention policy');
            recommendations.push('Define data retention policy for audit records');
          }
          break;

        case 'encryption':
          if (!audit.details.security.encryption.atRest) {
            missing.push('Data encryption at rest');
            violations.push({
              standard: 'GDPR',
              requirement: 'encryption',
              severity: 'high',
              description: 'Sensitive data must be encrypted at rest',
              recommendation: 'Enable encryption for audit data',
              status: 'open'
            });
          }
          break;
      }
    });

    return {
      compliant: missing.length === 0 && violations.length === 0,
      missing,
      violations,
      recommendations
    };
  }

  /**
   * Generate integrity hash
   */
  static generateIntegrityHash(audit: TemplateAudit): string {
    const hashData = {
      templateId: audit.templateId,
      action: audit.action,
      userId: audit.userId,
      timestamp: audit.timestamp.toISOString(),
      changes: audit.changes.map(c => ({ field: c.field, oldValue: c.oldValue, newValue: c.newValue }))
    };

    // Simple hash simulation - in real implementation would use crypto library
    return Buffer.from(JSON.stringify(hashData)).toString('base64').slice(0, 32);
  }

  /**
   * Validate audit chain integrity
   */
  static validateAuditChain(audits: TemplateAudit[]): {
    valid: boolean;
    brokenChains: Array<{ auditId: string; issue: string }>;
    recommendations: string[];
  } {
    const brokenChains: Array<{ auditId: string; issue: string }> = [];
    const recommendations: string[] = [];

    // Sort audits by timestamp
    const sortedAudits = [...audits].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 1; i < sortedAudits.length; i++) {
      const current = sortedAudits[i];
      const previous = sortedAudits[i - 1];

      // Check timestamp sequence
      if (current.timestamp.getTime() <= previous.timestamp.getTime()) {
        brokenChains.push({
          auditId: current.id,
          issue: 'Timestamp sequence violation'
        });
      }

      // Check hash chain (if implemented)
      if (current.metadata.chain_hash && previous.metadata.hash) {
        if (current.metadata.chain_hash !== previous.metadata.hash) {
          brokenChains.push({
            auditId: current.id,
            issue: 'Hash chain break'
          });
        }
      }

      // Check for logical sequence
      if (current.action === 'update' && previous.action === 'delete') {
        brokenChains.push({
          auditId: current.id,
          issue: 'Logical sequence violation: update after delete'
        });
      }
    }

    if (brokenChains.length > 0) {
      recommendations.push('Investigate audit chain integrity issues');
      recommendations.push('Review audit logging system for potential tampering');
    }

    return {
      valid: brokenChains.length === 0,
      brokenChains,
      recommendations
    };
  }
}