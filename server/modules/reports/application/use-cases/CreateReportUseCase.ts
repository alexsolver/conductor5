// ✅ 1QA.MD COMPLIANCE: APPLICATION USE CASE - BUSINESS LOGIC ORCHESTRATION
// Application Layer - Coordinates domain services and repositories

import { IReportsRepository } from '../../domain/repositories/IReportsRepository';
import { Report, ReportDomain } from '../../domain/entities/Report';
import { ReportsDomainService } from '../../domain/services/ReportsDomainService';
import { CreateReportDTO } from '../dto/CreateReportDTO';

export interface CreateReportUseCaseRequest {
  data: CreateReportDTO;
  userId: string;
  userRoles: string[];
  tenantId: string;
}

export interface CreateReportUseCaseResponse {
  success: boolean;
  data?: Report;
  errors?: string[];
  warnings?: string[];
}

export class CreateReportUseCase {
  constructor(
    private reportsRepository: IReportsRepository
  ) {}

  async execute(request: CreateReportUseCaseRequest): Promise<CreateReportUseCaseResponse> {
    try {
      const { data, userId, userRoles, tenantId } = request;

      // Validate business rules
      const validationErrors = ReportDomain.validateReportCreation({
        ...data,
        ownerId: userId,
        tenantId
      });

      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }

      // Check name uniqueness
      const isNameUnique = await this.reportsRepository.isNameUnique(data.name, tenantId);
      if (!isNameUnique) {
        return {
          success: false,
          errors: ['Report name must be unique within the tenant']
        };
      }

      // Prepare report data
      const reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId,
        name: data.name,
        description: data.description,
        type: data.type || 'standard',
        status: 'draft',
        category: data.category,
        dataSource: data.dataSource,
        query: data.query,
        queryConfig: data.queryConfig || {},
        filters: data.filters || {},
        parameters: data.parameters || {},
        layoutConfig: data.layoutConfig || {},
        chartConfig: data.chartConfig || {},
        formatConfig: data.formatConfig || {},
        ownerId: userId,
        isPublic: data.isPublic || false,
        accessLevel: data.accessLevel || 'view_only',
        allowedRoles: data.allowedRoles || [],
        allowedUsers: data.allowedUsers || [],
        lastExecutedAt: undefined,
        executionCount: 0,
        averageExecutionTime: 0,
        cacheConfig: data.cacheConfig || {},
        cacheExpiry: data.cacheExpiry || 300,
        exportFormats: data.exportFormats || ['pdf', 'excel', 'csv'],
        emailConfig: data.emailConfig || {},
        deliveryConfig: data.deliveryConfig || {},
        tags: data.tags || [],
        metadata: {
          ...data.metadata,
          createdBy: userId,
          createdAt: new Date().toISOString()
        },
        version: 1,
        isTemplate: data.isTemplate || false,
        templateId: data.templateId,
        createdBy: userId,
        updatedBy: undefined
      };

      // Create report
      const createdReport = await this.reportsRepository.create(reportData);

      // Generate warnings if applicable
      const warnings: string[] = [];
      
      if (data.cacheExpiry && data.cacheExpiry < 60) {
        warnings.push('Cache expiry is very low, may impact performance');
      }

      if (data.type === 'real_time' && !data.query) {
        warnings.push('Real-time reports should have optimized queries for better performance');
      }

      if (data.exportFormats && data.exportFormats.length > 5) {
        warnings.push('Many export formats may slow down report generation');
      }

      return {
        success: true,
        data: createdReport,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('[CreateReportUseCase] Error creating report:', error);
      return {
        success: false,
        errors: ['Failed to create report. Please try again.']
      };
    }
  }
}