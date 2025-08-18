/**
 * Update GDPR Report Use Case - Application Layer
 * Clean Architecture - Business logic implementation
 * Following 1qa.md enterprise patterns
 */

import { IGdprReportRepository } from '../../domain/repositories/IGdprReportRepository';
import { GdprReportEntity, GdprReportDomainService } from '../../domain/entities/GdprReport';

export interface UpdateGdprReportRequest {
  id: string;
  tenantId: string;
  updatedBy: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  riskLevel?: string;
  reportData?: Record<string, any>;
  findings?: Record<string, any>;
  actionItems?: Record<string, any>;
  assignedUserId?: string;
  reviewerUserId?: string;
  approverUserId?: string;
  dueDate?: Date;
  nextReviewDate?: Date;
}

export interface UpdateGdprReportResponse {
  success: boolean;
  data?: GdprReportEntity;
  error?: string;
  validationErrors?: string[];
}

export class UpdateGdprReportUseCase {
  constructor(
    private gdprReportRepository: IGdprReportRepository
  ) {}

  async execute(request: UpdateGdprReportRequest): Promise<UpdateGdprReportResponse> {
    try {
      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          validationErrors
        };
      }

      // Get existing report
      const existingReport = await this.gdprReportRepository.findById(
        request.id,
        request.tenantId
      );

      if (!existingReport) {
        return {
          success: false,
          error: 'GDPR report not found'
        };
      }

      // Prepare update data
      const updateData = {
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
        riskLevel: request.riskLevel,
        reportData: request.reportData,
        findings: request.findings,
        actionItems: request.actionItems,
        assignedUserId: request.assignedUserId,
        reviewerUserId: request.reviewerUserId,
        approverUserId: request.approverUserId,
        dueDate: request.dueDate,
        nextReviewDate: request.nextReviewDate,
        updatedBy: request.updatedBy
      };

      // Handle workflow transitions
      this.handleWorkflowTransitions(updateData, existingReport);

      // Update report
      const updatedReport = await this.gdprReportRepository.update(
        request.id,
        updateData,
        request.tenantId
      );

      // Recalculate compliance score if needed
      if (request.reportData || request.status || request.riskLevel) {
        const complianceScore = GdprReportDomainService.calculateComplianceScore(updatedReport);
        
        if (complianceScore !== updatedReport.complianceScore) {
          const finalReport = await this.gdprReportRepository.update(
            request.id,
            { complianceScore, updatedBy: request.updatedBy },
            request.tenantId
          );
          
          return {
            success: true,
            data: finalReport
          };
        }
      }

      return {
        success: true,
        data: updatedReport
      };

    } catch (error) {
      console.error('[UpdateGdprReportUseCase] Error:', error);
      return {
        success: false,
        error: 'Failed to update GDPR report'
      };
    }
  }

  private validateRequest(request: UpdateGdprReportRequest): string[] {
    const errors: string[] = [];

    if (!request.id?.trim()) {
      errors.push('Report ID is required');
    }

    if (!request.tenantId?.trim()) {
      errors.push('Tenant ID is required');
    }

    if (!request.updatedBy?.trim()) {
      errors.push('Updated by is required');
    }

    // Validate status if provided
    const validStatuses = ['draft', 'in_progress', 'under_review', 'approved', 'published', 'archived'];
    if (request.status && !validStatuses.includes(request.status)) {
      errors.push('Invalid status');
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'critical', 'urgent'];
    if (request.priority && !validPriorities.includes(request.priority)) {
      errors.push('Invalid priority');
    }

    // Validate risk level if provided
    const validRiskLevels = ['minimal', 'low', 'medium', 'high', 'very_high'];
    if (request.riskLevel && !validRiskLevels.includes(request.riskLevel)) {
      errors.push('Invalid risk level');
    }

    return errors;
  }

  private handleWorkflowTransitions(updateData: any, existingReport: GdprReportEntity): void {
    const now = new Date();

    // Handle status transitions
    if (updateData.status) {
      switch (updateData.status) {
        case 'in_progress':
          if (existingReport.status === 'draft') {
            updateData.submittedAt = now;
          }
          break;
          
        case 'approved':
          if (existingReport.status === 'under_review') {
            updateData.approvedAt = now;
          }
          break;
          
        case 'published':
          if (existingReport.status === 'approved') {
            updateData.publishedAt = now;
          }
          break;
      }
    }
  }
}