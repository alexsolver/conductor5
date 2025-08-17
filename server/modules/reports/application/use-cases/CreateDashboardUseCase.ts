// ✅ 1QA.MD COMPLIANCE: APPLICATION USE CASE - BUSINESS LOGIC ORCHESTRATION
// Application Layer - Coordinates domain services and repositories

import { IDashboardsRepository } from '../../domain/repositories/IDashboardsRepository';
import { Dashboard, DashboardDomain } from '../../domain/entities/Dashboard';
import { CreateDashboardDTO } from '../dto/CreateDashboardDTO';

export interface CreateDashboardUseCaseRequest {
  data: CreateDashboardDTO;
  userId: string;
  userRoles: string[];
  tenantId: string;
}

export interface CreateDashboardUseCaseResponse {
  success: boolean;
  data?: Dashboard;
  errors?: string[];
  warnings?: string[];
}

export class CreateDashboardUseCase {
  constructor(
    private dashboardsRepository: IDashboardsRepository
  ) {}

  async execute(request: CreateDashboardUseCaseRequest): Promise<CreateDashboardUseCaseResponse> {
    try {
      const { data, userId, userRoles, tenantId } = request;

      // Validate business rules
      const validationErrors = DashboardDomain.validateDashboardCreation({
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
      const isNameUnique = await this.dashboardsRepository.isDashboardNameUnique(data.name, tenantId);
      if (!isNameUnique) {
        return {
          success: false,
          errors: ['Dashboard name must be unique within the tenant']
        };
      }

      // Generate share token if public
      let shareToken: string | undefined;
      if (data.isPublic) {
        shareToken = DashboardDomain.generateShareToken();
      }

      // Prepare dashboard data
      const dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId,
        name: data.name,
        description: data.description,
        layoutType: data.layoutType || 'grid',
        status: 'draft',
        layoutConfig: data.layoutConfig || {},
        themeConfig: data.themeConfig || {},
        styleConfig: data.styleConfig || {},
        ownerId: userId,
        isPublic: data.isPublic || false,
        shareToken,
        shareExpiresAt: undefined,
        accessLevel: data.accessLevel || 'view_only',
        allowedRoles: data.allowedRoles || [],
        allowedUsers: data.allowedUsers || [],
        isRealTime: data.isRealTime || false,
        refreshInterval: data.refreshInterval || 300,
        autoRefresh: data.autoRefresh !== false,
        mobileConfig: data.mobileConfig || {},
        tabletConfig: data.tabletConfig || {},
        desktopConfig: data.desktopConfig || {},
        isFavorite: false,
        viewCount: 0,
        lastViewedAt: undefined,
        tags: data.tags || [],
        metadata: {
          ...data.metadata,
          createdBy: userId,
          createdAt: new Date().toISOString()
        },
        version: 1,
        createdBy: userId,
        updatedBy: undefined
      };

      // Create dashboard
      const createdDashboard = await this.dashboardsRepository.create(dashboardData);

      // Generate warnings if applicable
      const warnings: string[] = [];
      
      if (data.refreshInterval && data.refreshInterval < 30) {
        warnings.push('Refresh interval is very low, may impact performance');
      }

      if (data.isRealTime && data.refreshInterval > 60) {
        warnings.push('Real-time dashboards should have shorter refresh intervals');
      }

      if (data.isPublic && !shareToken) {
        warnings.push('Public dashboard created without share token');
      }

      return {
        success: true,
        data: createdDashboard,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('[CreateDashboardUseCase] Error creating dashboard:', error);
      return {
        success: false,
        errors: ['Failed to create dashboard. Please try again.']
      };
    }
  }
}