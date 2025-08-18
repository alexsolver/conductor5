/**
 * Create GDPR Report Use Case - Application Layer
 * Clean Architecture - Business logic implementation
 * Following 1qa.md enterprise patterns
 */

import { IGdprReportRepository } from '../../domain/repositories/IGdprReportRepository';
import { GdprReportEntity, GdprReportDomainService } from '../../domain/entities/GdprReport';

export interface CreateGdprReportRequest {
  title: string;
  description?: string;
  reportType: string;
  priority: string;
  riskLevel?: string;
  reportData?: Record<string, any>;
  assignedUserId?: string;
  dueDate?: Date;
  createdBy: string;
  tenantId: string;
}

export interface CreateGdprReportResponse {
  success: boolean;
  data?: GdprReportEntity;
  error?: string;
  validationErrors?: string[];
}

export class CreateGdprReportUseCase {
  constructor(
    private gdprReportRepository: IGdprReportRepository
  ) {}

  async execute(request: CreateGdprReportRequest): Promise<CreateGdprReportResponse> {
    try {
      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          validationErrors
        };
      }

      // Create report
      const report = await this.gdprReportRepository.create({
        title: request.title,
        description: request.description,
        reportType: request.reportType,
        priority: request.priority,
        riskLevel: request.riskLevel,
        reportData: request.reportData,
        assignedUserId: request.assignedUserId,
        dueDate: request.dueDate,
        createdBy: request.createdBy,
        tenantId: request.tenantId
      });

      // Calculate initial compliance score
      const complianceScore = GdprReportDomainService.calculateComplianceScore(report);
      
      // Update report with score
      const updatedReport = await this.gdprReportRepository.update(
        report.id,
        { 
          complianceScore,
          updatedBy: request.createdBy
        },
        request.tenantId
      );

      return {
        success: true,
        data: updatedReport
      };

    } catch (error) {
      console.error('[CreateGdprReportUseCase] Error:', error);
      return {
        success: false,
        error: 'Failed to create GDPR report'
      };
    }
  }

  private validateRequest(request: CreateGdprReportRequest): string[] {
    const errors: string[] = [];

    if (!request.title?.trim()) {
      errors.push('Title is required');
    }

    if (!request.reportType?.trim()) {
      errors.push('Report type is required');
    }

    if (!request.priority?.trim()) {
      errors.push('Priority is required');
    }

    if (!request.createdBy?.trim()) {
      errors.push('Created by is required');
    }

    if (!request.tenantId?.trim()) {
      errors.push('Tenant ID is required');
    }

    // Validate report type
    const validReportTypes = [
      'dpia', 'audit_trail', 'data_breach', 'consent_management',
      'right_of_access', 'right_of_rectification', 'right_of_erasure',
      'data_portability', 'processing_activities', 'vendor_assessment',
      'training_compliance', 'incident_response'
    ];
    
    if (request.reportType && !validReportTypes.includes(request.reportType)) {
      errors.push('Invalid report type');
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical', 'urgent'];
    if (request.priority && !validPriorities.includes(request.priority)) {
      errors.push('Invalid priority');
    }

    // Validate risk level if provided
    const validRiskLevels = ['minimal', 'low', 'medium', 'high', 'very_high'];
    if (request.riskLevel && !validRiskLevels.includes(request.riskLevel)) {
      errors.push('Invalid risk level');
    }

    // Type-specific validations
    if (request.reportType === 'data_breach' && !request.dueDate) {
      errors.push('Due date is required for data breach reports');
    }

    if (request.reportType === 'dpia' && !request.riskLevel) {
      errors.push('Risk level is required for DPIA reports');
    }

    return errors;
  }
}