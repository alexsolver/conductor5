/**
 * Get Tenant Admin Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetTenantAdminUseCase
 * @created 2025-08-12 - Phase 22 Clean Architecture Implementation
 */

import { ITenantAdminRepository } from '../../domain/repositories/ITenantAdminRepository';
import { TenantAdmin, TenantAdminDomainService } from '../../domain/entities/TenantAdmin';

export interface GetTenantAdminRequest {
  tenantId?: string;
  adminId?: string;
  adminUserId?: string;
  userRole: string;
  includeAnalytics?: boolean;
  includeHealth?: boolean;
  includeUsage?: boolean;
  includeBilling?: boolean;
  includeRecommendations?: boolean;
}

export interface GetTenantAdminResponse {
  success: boolean;
  data?: {
    tenantAdmin?: TenantAdmin;
    tenantAdmins?: TenantAdmin[];
    analytics?: {
      overview: {
        usersCount: number;
        ticketsCount: number;
        storageUsed: number;
        apiCallsThisMonth: number;
        uptime: number;
        healthScore: number;
      };
      trends: Array<{
        metric: string;
        direction: 'up' | 'down' | 'stable';
        percentage: number;
        period: string;
      }>;
      predictions: Array<{
        metric: string;
        predictedValue: number;
        confidence: number;
        timeframe: string;
      }>;
      recommendations: any[];
    };
    health?: {
      status: 'healthy' | 'warning' | 'critical' | 'maintenance';
      score: number;
      checks: any[];
      issues: any[];
      lastCheck: Date;
    };
    usage?: {
      realTime: any;
      historical: any;
      analytics: any;
      reports: any[];
    };
    billing?: {
      plan: any;
      subscription: any;
      usage: any;
      invoices: any[];
      paymentMethod: any;
      billing: any;
    };
    recommendations?: any[];
  };
  errors?: string[];
}

export class GetTenantAdminUseCase {
  constructor(private tenantAdminRepository: ITenantAdminRepository) {}

  async execute(request: GetTenantAdminRequest): Promise<GetTenantAdminResponse> {
    try {
      let tenantAdmin: TenantAdmin | null = null;
      let tenantAdmins: TenantAdmin[] = [];

      // 1. Get tenant admin data based on request type
      if (request.adminId) {
        tenantAdmin = await this.tenantAdminRepository.findById(request.adminId);
        
        if (!tenantAdmin) {
          return {
            success: false,
            errors: ['Tenant admin not found']
          };
        }
      } else if (request.tenantId) {
        tenantAdmin = await this.tenantAdminRepository.findByTenantId(request.tenantId);
        
        if (!tenantAdmin) {
          return {
            success: false,
            errors: ['Tenant admin configuration not found']
          };
        }
      } else if (request.adminUserId) {
        tenantAdmins = await this.tenantAdminRepository.findByAdminUserId(request.adminUserId);
        
        if (tenantAdmins.length === 0) {
          return {
            success: false,
            errors: ['No tenant admin roles found for user']
          };
        }
      } else {
        // Get all tenant admins (for system admins only)
        if (request.userRole !== 'saas_admin') {
          return {
            success: false,
            errors: ['Insufficient permissions to view all tenant admins']
          };
        }
        
        tenantAdmins = await this.tenantAdminRepository.findAll();
      }

      // 2. Check permissions
      const targetTenantAdmin = tenantAdmin || tenantAdmins[0];
      if (targetTenantAdmin && !this.hasViewPermission(targetTenantAdmin, request.userRole, request.adminUserId)) {
        return {
          success: false,
          errors: ['Insufficient permissions to view tenant admin data']
        };
      }

      // 3. Prepare response data
      const responseData: any = {};

      if (tenantAdmin) {
        responseData.tenantAdmin = tenantAdmin;
      } else {
        responseData.tenantAdmins = tenantAdmins;
      }

      // 4. Include additional data if requested
      if (tenantAdmin && request.includeAnalytics) {
        responseData.analytics = await this.tenantAdminRepository.getTenantAnalytics(tenantAdmin.tenantId);
      }

      if (tenantAdmin && request.includeHealth) {
        responseData.health = await this.tenantAdminRepository.getHealth(tenantAdmin.tenantId);
      }

      if (tenantAdmin && request.includeUsage) {
        responseData.usage = await this.tenantAdminRepository.getUsage(tenantAdmin.tenantId);
      }

      if (tenantAdmin && request.includeBilling) {
        responseData.billing = await this.tenantAdminRepository.getBilling(tenantAdmin.tenantId);
      }

      if (tenantAdmin && request.includeRecommendations) {
        responseData.recommendations = await this.tenantAdminRepository.getUsageRecommendations(tenantAdmin.tenantId);
      }

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      console.error('[GetTenantAdminUseCase] Error:', error);
      return {
        success: false,
        errors: ['Internal server error']
      };
    }
  }

  private hasViewPermission(tenantAdmin: TenantAdmin, userRole: string, adminUserId?: string): boolean {
    // SaaS admin has full access
    if (userRole === 'saas_admin') {
      return true;
    }

    // Tenant admin can view their own tenant
    if (adminUserId && tenantAdmin.adminUserId === adminUserId) {
      return true;
    }

    // Check specific permissions
    if (adminUserId) {
      return TenantAdminDomainService.hasPermission(
        tenantAdmin,
        'tenant_admin',
        'view',
        'configuration'
      );
    }

    return false;
  }
}