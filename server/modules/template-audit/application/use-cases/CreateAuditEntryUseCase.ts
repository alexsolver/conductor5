/**
 * Create Audit Entry Use Case
 * Clean Architecture - Application Layer
 * 
 * @module CreateAuditEntryUseCase
 * @created 2025-08-12 - Phase 23 Clean Architecture Implementation
 */

import { ITemplateAuditRepository } from '../../domain/repositories/ITemplateAuditRepository';
import { TemplateAudit, TemplateType, AuditType, AuditAction, AuditChange, TemplateAuditDomainService } from '../../domain/entities/TemplateAudit';

export interface CreateAuditEntryRequest {
  tenantId: string;
  templateId: string;
  templateType: TemplateType;
  auditType: AuditType;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  userRole: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  reason?: string;
  changes?: AuditChange[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  tags?: string[];
  context?: any;
}

export interface CreateAuditEntryResponse {
  success: boolean;
  data?: {
    audit: TemplateAudit;
    riskAssessment: {
      score: number;
      level: 'low' | 'medium' | 'high' | 'critical';
      factors: Array<{ factor: string; score: number; weight: number }>;
    };
    complianceCheck: {
      compliant: boolean;
      violations: any[];
      requirements: string[];
      recommendations: string[];
    };
    integrityHash: string;
  };
  errors?: string[];
  warnings?: string[];
}

export class CreateAuditEntryUseCase {
  constructor(private auditRepository: ITemplateAuditRepository) {}

  async execute(request: CreateAuditEntryRequest): Promise<CreateAuditEntryResponse> {
    try {
      // 1. Validate input
      const validation = this.validateInput(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // 2. Determine severity if not provided
      const severity = request.severity || this.determineSeverity(request);

      // 3. Create audit details
      const auditDetails = await this.createAuditDetails(request);

      // 4. Process changes if provided
      const processedChanges = this.processChanges(request.changes || []);

      // 5. Create audit metadata
      const metadata = this.createAuditMetadata();

      // 6. Build audit entry
      const auditEntry: Omit<TemplateAudit, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: request.tenantId,
        templateId: request.templateId,
        templateType: request.templateType,
        auditType: request.auditType,
        action: request.action,
        entityType: request.entityType as any,
        entityId: request.entityId,
        entityName: request.entityName,
        userId: request.userId,
        userName: request.userName,
        userRole: request.userRole,
        sessionId: request.sessionId,
        ipAddress: request.ipAddress || 'unknown',
        userAgent: request.userAgent || 'unknown',
        timestamp: new Date(),
        details: auditDetails,
        changes: processedChanges,
        metadata,
        status: 'pending',
        severity,
        category: this.determineCategory(request),
        tags: request.tags || [],
        isActive: true
      };

      // 7. Validate audit entry with domain service
      const domainValidation = TemplateAuditDomainService.validateAuditEntry(auditEntry);
      if (!domainValidation.isValid) {
        return {
          success: false,
          errors: domainValidation.errors,
          warnings: domainValidation.warnings
        };
      }

      // 8. Create audit entry
      const createdAudit = await this.auditRepository.create(auditEntry);

      // 9. Perform risk assessment
      const riskAssessment = TemplateAuditDomainService.calculateRiskScore(createdAudit);

      // 10. Check compliance
      const complianceCheck = TemplateAuditDomainService.checkComplianceRequirements(
        createdAudit,
        ['audit_trail', 'data_retention', 'encryption']
      );

      // 11. Generate integrity hash
      const integrityHash = TemplateAuditDomainService.generateIntegrityHash(createdAudit);

      // 12. Update audit with hash
      await this.auditRepository.update(createdAudit.id, request.tenantId, {
        metadata: {
          ...createdAudit.metadata,
          hash: integrityHash
        },
        status: 'processed'
      });

      return {
        success: true,
        data: {
          audit: { ...createdAudit, metadata: { ...createdAudit.metadata, hash: integrityHash }, status: 'processed' },
          riskAssessment,
          complianceCheck,
          integrityHash
        },
        warnings: domainValidation.warnings
      };

    } catch (error) {
      console.error('[CreateAuditEntryUseCase] Error:', error);
      return {
        success: false,
        errors: ['Internal server error while creating audit entry']
      };
    }
  }

  private validateInput(request: CreateAuditEntryRequest): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!request.tenantId) errors.push('Tenant ID is required');
    if (!request.templateId) errors.push('Template ID is required');
    if (!request.templateType) errors.push('Template type is required');
    if (!request.auditType) errors.push('Audit type is required');
    if (!request.action) errors.push('Action is required');
    if (!request.userId) errors.push('User ID is required');
    if (!request.userName) errors.push('User name is required');
    if (!request.userRole) errors.push('User role is required');
    if (!request.sessionId) errors.push('Session ID is required');
    if (!request.description) errors.push('Description is required');

    // Validation rules
    if (request.description && request.description.length < 10) {
      warnings.push('Description is very short, consider adding more detail');
    }

    if (request.action === 'delete' && !request.reason) {
      warnings.push('Deletion reason is recommended for audit compliance');
    }

    if (request.action === 'update' && (!request.changes || request.changes.length === 0)) {
      warnings.push('No changes specified for update action');
    }

    // Security validations
    if (!request.ipAddress) {
      warnings.push('IP address not provided, may impact security audit trail');
    }

    if (!request.userAgent) {
      warnings.push('User agent not provided, may impact security audit trail');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private determineSeverity(request: CreateAuditEntryRequest): 'low' | 'medium' | 'high' | 'critical' {
    // High risk actions
    if (['delete', 'unpublish', 'deactivate'].includes(request.action)) {
      return 'high';
    }

    // Medium risk actions
    if (['update', 'deploy', 'activate', 'publish'].includes(request.action)) {
      return 'medium';
    }

    // High risk templates
    if (['system_template', 'workflow_template'].includes(request.templateType)) {
      return 'high';
    }

    // High risk users
    if (['saas_admin', 'tenant_admin'].includes(request.userRole)) {
      return 'medium';
    }

    return 'low';
  }

  private async createAuditDetails(request: CreateAuditEntryRequest): Promise<any> {
    const now = new Date();

    return {
      description: request.description,
      reason: request.reason,
      source: {
        type: 'web_ui',
        application: 'conductor',
        component: 'template_management',
        version: '1.0.0'
      },
      context: {
        requestId: `req_${Date.now()}`,
        environment: process.env.NODE_ENV || 'development',
        feature: 'template_audit',
        module: 'template-audit',
        ...request.context
      },
      impact: {
        scope: this.determineScope(request),
        affectedEntities: [request.entityId],
        affectedUsers: [request.userId],
        affectedTenants: [request.tenantId],
        riskLevel: 'medium',
        businessImpact: this.determineBusinessImpact(request),
        technicalImpact: this.determineTechnicalImpact(request)
      },
      validation: {
        isValid: true,
        validatedAt: now,
        validatedBy: 'system',
        validationRules: [],
        errors: [],
        warnings: [],
        recommendations: []
      },
      compliance: {
        standards: this.getApplicableStandards(request),
        violations: [],
        certifications: [],
        requirements: ['audit_trail', 'data_retention'],
        exemptions: [],
        status: 'compliant'
      },
      performance: {
        executionTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkCalls: 0,
        databaseQueries: 1,
        cacheHits: 0,
        cacheMisses: 0,
        warnings: [],
        recommendations: []
      },
      security: {
        permissions: [{
          type: 'granted',
          principal: request.userId,
          principalType: 'user',
          resource: request.templateId,
          action: request.action,
          grantedAt: now
        }],
        threats: [],
        vulnerabilities: [],
        controls: [],
        classifications: [{
          level: 'internal',
          categories: ['template_data'],
          handling: ['standard'],
          retention: '7_years',
          disposal: 'secure_delete',
          access: [request.userRole]
        }],
        encryption: {
          inTransit: true,
          atRest: true,
          algorithm: 'AES-256',
          keyLength: 256,
          keyRotation: false,
          compliance: ['GDPR', 'SOX']
        }
      }
    };
  }

  private processChanges(changes: AuditChange[]): AuditChange[] {
    return changes.map((change, index) => ({
      ...change,
      id: change.id || `change_${Date.now()}_${index}`,
      changeType: change.changeType || this.determineChangeType(change),
      impact: {
        breaking: this.isBreakingChange(change),
        backward_compatible: this.isBackwardCompatible(change),
        performance_impact: 'neutral',
        security_impact: 'neutral',
        user_impact: 'neutral',
        system_impact: 'low',
        dependencies: []
      },
      validation: {
        syntax_valid: true,
        semantically_valid: true,
        business_rules_valid: true,
        security_validated: true,
        performance_tested: false,
        compatibility_checked: false,
        errors: [],
        warnings: []
      },
      metadata: {
        size: this.calculateChangeSize(change),
        complexity: this.determineComplexity(change),
        confidence: 0.9,
        automated: false,
        reviewed: false,
        approved: false,
        rolled_back: false
      }
    }));
  }

  private createAuditMetadata(): any {
    return {
      version: '1.0.0',
      schema_version: '1.0',
      processor_version: '1.0.0',
      retention_policy: {
        retain_days: 2555, // 7 years
        archive_after_days: 365,
        delete_after_days: 2555,
        legal_hold: false,
        compliance_requirements: ['SOX', 'GDPR'],
        auto_archive: true,
        auto_delete: false
      },
      checksum: ''
    };
  }

  private determineCategory(request: CreateAuditEntryRequest): any {
    if (['delete', 'deactivate', 'unpublish'].includes(request.action)) {
      return 'security';
    }

    if (request.templateType === 'system_template') {
      return 'system_activity';
    }

    if (['deploy', 'activate', 'publish'].includes(request.action)) {
      return 'deployment';
    }

    return 'user_activity';
  }

  private determineScope(request: CreateAuditEntryRequest): 'single' | 'multiple' | 'system_wide' | 'tenant_wide' {
    if (request.templateType === 'system_template') {
      return 'system_wide';
    }

    if (['deploy', 'publish'].includes(request.action)) {
      return 'tenant_wide';
    }

    return 'single';
  }

  private determineBusinessImpact(request: CreateAuditEntryRequest): 'none' | 'minimal' | 'moderate' | 'significant' | 'severe' {
    if (['delete', 'unpublish'].includes(request.action)) {
      return 'significant';
    }

    if (['deploy', 'activate', 'publish'].includes(request.action)) {
      return 'moderate';
    }

    return 'minimal';
  }

  private determineTechnicalImpact(request: CreateAuditEntryRequest): 'none' | 'minimal' | 'moderate' | 'significant' | 'severe' {
    if (request.templateType === 'system_template') {
      return 'significant';
    }

    if (['deploy', 'update'].includes(request.action)) {
      return 'moderate';
    }

    return 'minimal';
  }

  private getApplicableStandards(request: CreateAuditEntryRequest): any[] {
    const standards = [];

    // Always applicable
    standards.push({
      name: 'SOX',
      version: '2002',
      type: 'regulation',
      status: 'applicable',
      compliance: 'compliant',
      requirements: ['audit_trail', 'change_control'],
      violations: []
    });

    if (['delete', 'export'].includes(request.action)) {
      standards.push({
        name: 'GDPR',
        version: '2018',
        type: 'regulation',
        status: 'applicable',
        compliance: 'compliant',
        requirements: ['data_protection', 'audit_logging'],
        violations: []
      });
    }

    return standards;
  }

  private determineChangeType(change: AuditChange): any {
    if (!change.oldValue && change.newValue) {
      return 'addition';
    }

    if (change.oldValue && !change.newValue) {
      return 'removal';
    }

    if (change.oldValue !== change.newValue) {
      return 'modification';
    }

    return 'modification';
  }

  private isBreakingChange(change: AuditChange): boolean {
    // Simple heuristics for breaking changes
    return change.operation === 'delete' || 
           (change.field.includes('id') && change.operation === 'update') ||
           (change.field.includes('type') && change.operation === 'update');
  }

  private isBackwardCompatible(change: AuditChange): boolean {
    // Simple heuristics for backward compatibility
    return change.operation === 'create' || 
           (change.operation === 'update' && !this.isBreakingChange(change));
  }

  private calculateChangeSize(change: AuditChange): number {
    const oldSize = JSON.stringify(change.oldValue || '').length;
    const newSize = JSON.stringify(change.newValue || '').length;
    return Math.abs(newSize - oldSize);
  }

  private determineComplexity(change: AuditChange): 'low' | 'medium' | 'high' {
    const size = this.calculateChangeSize(change);
    
    if (size > 1000) return 'high';
    if (size > 100) return 'medium';
    return 'low';
  }
}