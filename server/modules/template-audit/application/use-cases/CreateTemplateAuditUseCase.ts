/**
 * CreateTemplateAuditUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for template audit creation business logic
 */

import { TemplateAudit } from '../../domain/entities/TemplateAudit';

interface TemplateAuditRepositoryInterface {
  save(audit: TemplateAudit): Promise<void>;
  findRecentByTemplate(templateId: string, tenantId: string, hours?: number): Promise<TemplateAudit[]>;
}

interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

interface AuditMetrics {
  usage_count: number;
  error_count: number;
  performance_score: number;
  last_used: Date;
}

export interface CreateTemplateAuditRequest {
  tenantId: string;
  templateId: string;
  templateName: string;
  action: 'created' | 'updated' | 'deleted' | 'used' | 'validated' | 'deployed';
  performedById: string;
  performedByName: string;
  changes?: AuditChange[];
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  status?: 'success' | 'failed' | 'pending';
  metrics?: AuditMetrics;
}

export interface CreateTemplateAuditResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    templateId: string;
    action: string;
    severity: string;
    status: string;
    timestamp: Date;
    changeCount: number;
    sessionId: string;
  };
}

export class CreateTemplateAuditUseCase {
  constructor(
    private readonly auditRepository: TemplateAuditRepositoryInterface
  ) {}

  async execute(request: CreateTemplateAuditRequest): Promise<CreateTemplateAuditResponse> {
    // Validate required fields
    if (!request.templateId || !request.templateName) {
      return {
        success: false,
        message: 'Template ID and name are required'
      };
    }

    if (!request.performedById || !request.performedByName) {
      return {
        success: false,
        message: 'Performer ID and name are required'
      };
    }

    try {
      // Create audit entity
      const audit = new TemplateAudit(
        generateId(),
        request.tenantId,
        request.templateId,
        request.templateName,
        request.action,
        request.performedById,
        request.performedByName,
        [],
        request.metadata || {},
        request.severity || 'info',
        request.status || 'success',
        request.metrics || null
      );

      // Add changes if provided
      if (request.changes) {
        request.changes.forEach(change => {
          audit.addChange(change.field, change.oldValue, change.newValue);
        });
      }

      // Auto-determine severity based on action and changes
      const determinedSeverity = this.determineSeverity(request.action, request.changes);
      if (determinedSeverity !== 'info') {
        audit.updateSeverity(determinedSeverity);
      }

      // Add metadata for tracking
      audit.addMetadata('user_agent', 'system');
      audit.addMetadata('ip_address', 'internal');
      
      if (request.metadata) {
        Object.entries(request.metadata).forEach(([key, value]) => {
          audit.addMetadata(key, value);
        });
      }

      // Check for recent similar activities
      const recentAudits = await this.auditRepository.findRecentByTemplate(
        request.templateId,
        request.tenantId,
        1 // last 1 hour
      );

      // Add context about recent activity
      if (recentAudits.length > 0) {
        audit.addMetadata('recent_activity_count', recentAudits.length);
        audit.addMetadata('last_activity', recentAudits[0].getTimestamp());
      }

      // Save audit record
      await this.auditRepository.save(audit);

      return {
        success: true,
        message: 'Template audit record created successfully',
        data: {
          id: audit.getId(),
          templateId: audit.getTemplateId(),
          action: audit.getAction(),
          severity: audit.getSeverity(),
          status: audit.getStatus(),
          timestamp: audit.getTimestamp(),
          changeCount: audit.getChangeCount(),
          sessionId: audit.getSessionId()
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create template audit';
      return {
        success: false,
        message
      };
    }
  }

  private determineSeverity(action: string, changes?: AuditChange[]): 'info' | 'warning' | 'error' | 'critical' {
    // Critical actions
    if (action === 'deleted') {
      return 'critical';
    }

    // High-impact changes
    if (changes && changes.length > 0) {
      const criticalFields = ['schema', 'structure', 'permissions', 'security'];
      const errorFields = ['validation', 'configuration', 'dependencies'];
      
      const hasCriticalChange = changes.some(change => 
        criticalFields.some(field => change.field.toLowerCase().includes(field))
      );
      
      const hasErrorChange = changes.some(change => 
        errorFields.some(field => change.field.toLowerCase().includes(field))
      );

      if (hasCriticalChange) {
        return 'critical';
      }

      if (hasErrorChange) {
        return 'error';
      }

      // Many changes might indicate complexity
      if (changes.length > 10) {
        return 'warning';
      }
    }

    // Deployment actions are important
    if (action === 'deployed') {
      return 'warning';
    }

    return 'info';
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}