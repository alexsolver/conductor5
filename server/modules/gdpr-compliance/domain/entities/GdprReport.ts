/**
 * GDPR Report Entity - Domain Layer
 * Clean Architecture - Pure business logic entity
 * Following 1qa.md enterprise patterns
 */

export interface GdprReportEntity {
  id: string;
  title: string;
  description?: string;
  reportType: GdprReportType;
  status: GdprReportStatus;
  priority: GdprPriority;
  riskLevel?: GdprRiskLevel;
  
  // Structured data
  reportData?: Record<string, any>;
  findings?: Record<string, any>;
  actionItems?: Record<string, any>;
  attachments?: Record<string, any>;
  
  // Compliance tracking
  complianceScore?: number;
  lastAuditDate?: Date;
  nextReviewDate?: Date;
  dueDate?: Date;
  
  // Stakeholders
  assignedUserId?: string;
  reviewerUserId?: string;
  approverUserId?: string;
  
  // Workflow timestamps
  submittedAt?: Date;
  approvedAt?: Date;
  publishedAt?: Date;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  tenantId: string;
  
  // Soft delete
  deletedAt?: Date;
  deletedBy?: string;
  isActive: boolean;
}

export type GdprReportType = 
  | 'dpia'
  | 'audit_trail'
  | 'data_breach'
  | 'consent_management'
  | 'right_of_access'
  | 'right_of_rectification'
  | 'right_of_erasure'
  | 'data_portability'
  | 'processing_activities'
  | 'vendor_assessment'
  | 'training_compliance'
  | 'incident_response';

export type GdprReportStatus = 
  | 'draft'
  | 'in_progress'
  | 'under_review'
  | 'approved'
  | 'published'
  | 'archived';

export type GdprPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'urgent';

export type GdprRiskLevel = 
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

/**
 * Domain Service Methods
 * Pure business logic without external dependencies
 */
export class GdprReportDomainService {
  
  /**
   * Calculate compliance score based on report data
   */
  static calculateComplianceScore(report: GdprReportEntity): number {
    if (!report.reportData) return 0;
    
    // Business logic for compliance scoring
    let score = 50; // Base score
    
    // Adjust based on report type
    if (report.reportType === 'dpia') score += 20;
    if (report.reportType === 'data_breach') score -= 10;
    
    // Adjust based on completion status
    if (report.status === 'approved') score += 20;
    if (report.status === 'published') score += 30;
    
    // Risk level adjustments
    switch (report.riskLevel) {
      case 'minimal': score += 10; break;
      case 'low': score += 5; break;
      case 'high': score -= 5; break;
      case 'very_high': score -= 15; break;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Determine if report requires immediate attention
   */
  static requiresImmediateAttention(report: GdprReportEntity): boolean {
    if (report.priority === 'critical' || report.priority === 'urgent') return true;
    if (report.reportType === 'data_breach') return true;
    if (report.riskLevel === 'very_high') return true;
    if (report.dueDate && report.dueDate < new Date()) return true;
    
    return false;
  }
  
  /**
   * Get next required workflow step
   */
  static getNextWorkflowStep(report: GdprReportEntity): string {
    switch (report.status) {
      case 'draft': return 'Submit for Review';
      case 'in_progress': return 'Complete Report';
      case 'under_review': return 'Approve or Request Changes';
      case 'approved': return 'Publish Report';
      case 'published': return 'Archive Report';
      default: return 'No Action Required';
    }
  }
  
  /**
   * Validate report completeness
   */
  static validateReportCompleteness(report: GdprReportEntity): { isComplete: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    if (!report.title) missingFields.push('title');
    if (!report.reportType) missingFields.push('reportType');
    if (!report.assignedUserId) missingFields.push('assignedUserId');
    
    // Type-specific validations
    if (report.reportType === 'dpia' && !report.riskLevel) {
      missingFields.push('riskLevel');
    }
    
    if (report.reportType === 'data_breach' && !report.dueDate) {
      missingFields.push('dueDate');
    }
    
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }
}