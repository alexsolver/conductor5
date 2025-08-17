// ✅ 1QA.MD COMPLIANCE: APPLICATION USE CASE - BUSINESS LOGIC ORCHESTRATION
// Application Layer - Coordinates domain services and repositories

import { IDashboardsRepository } from '../../domain/repositories/IDashboardsRepository';
import { DashboardWidget, DashboardDomain } from '../../domain/entities/Dashboard';
import { CreateDashboardWidgetDTO } from '../dto/CreateDashboardDTO';

export interface CreateDashboardWidgetUseCaseRequest {
  data: CreateDashboardWidgetDTO;
  userId: string;
  userRoles: string[];
  tenantId: string;
}

export interface CreateDashboardWidgetUseCaseResponse {
  success: boolean;
  data?: DashboardWidget;
  errors?: string[];
  warnings?: string[];
}

export class CreateDashboardWidgetUseCase {
  constructor(
    private dashboardsRepository: IDashboardsRepository
  ) {}

  async execute(request: CreateDashboardWidgetUseCaseRequest): Promise<CreateDashboardWidgetUseCaseResponse> {
    try {
      const { data, userId, userRoles, tenantId } = request;

      // Validate business rules
      const validationErrors = DashboardDomain.validateWidgetCreation({
        ...data,
        tenantId
      });

      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }

      // Check if dashboard exists and user has access
      const dashboard = await this.dashboardsRepository.findById(data.dashboardId, tenantId);
      if (!dashboard) {
        return {
          success: false,
          errors: ['Dashboard not found']
        };
      }

      // Check user access to dashboard
      if (!DashboardDomain.canUserModifyDashboard(dashboard, userId, userRoles)) {
        return {
          success: false,
          errors: ['You do not have permission to modify this dashboard']
        };
      }

      // Get existing widgets to validate position
      const existingWidgets = await this.dashboardsRepository.findWidgetsByDashboard(data.dashboardId, tenantId);
      
      // Validate widget position doesn't overlap
      const isPositionValid = DashboardDomain.validateWidgetPosition(existingWidgets, data);
      if (!isPositionValid) {
        return {
          success: false,
          errors: ['Widget position overlaps with existing widget']
        };
      }

      // Prepare widget data
      const widgetData: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId,
        dashboardId: data.dashboardId,
        name: data.name,
        type: data.type,
        reportId: data.reportId,
        position: data.position,
        gridPosition: data.gridPosition || {},
        zIndex: data.zIndex || 1,
        config: data.config || {},
        dataConfig: data.dataConfig || {},
        styleConfig: data.styleConfig || {},
        interactionConfig: data.interactionConfig || {},
        query: data.query,
        cacheConfig: data.cacheConfig || {},
        refreshInterval: data.refreshInterval || 300,
        isRealTime: data.isRealTime || false,
        mobileConfig: data.mobileConfig || {},
        tabletConfig: data.tabletConfig || {},
        isVisible: data.isVisible !== false,
        isInteractive: data.isInteractive !== false
      };

      // Create widget
      const createdWidget = await this.dashboardsRepository.createWidget(widgetData);

      // Generate warnings if applicable
      const warnings: string[] = [];
      
      if (data.refreshInterval && data.refreshInterval < 30) {
        warnings.push('Widget refresh interval is very low, may impact performance');
      }

      if (data.isRealTime && !data.query && !data.reportId) {
        warnings.push('Real-time widget should have a data source (query or report)');
      }

      if (data.position.width < 2 || data.position.height < 2) {
        warnings.push('Widget size is very small, content may not display properly');
      }

      if (existingWidgets.length >= 20) {
        warnings.push('Dashboard has many widgets, consider performance optimization');
      }

      return {
        success: true,
        data: createdWidget,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('[CreateDashboardWidgetUseCase] Error creating widget:', error);
      return {
        success: false,
        errors: ['Failed to create widget. Please try again.']
      };
    }
  }
}