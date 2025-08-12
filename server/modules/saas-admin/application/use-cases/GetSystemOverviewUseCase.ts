/**
 * Get System Overview Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetSystemOverviewUseCase
 * @created 2025-08-12 - Phase 18 Clean Architecture Implementation
 */

import { ISaasAdminRepository } from '../../domain/repositories/ISaasAdminRepository';
import { SystemOverview, SaasAdminDomainService } from '../../domain/entities/SaasAdmin';

export interface GetSystemOverviewRequest {
  adminId: string;
  adminRole: string;
}

export interface GetSystemOverviewResponse {
  success: boolean;
  data?: SystemOverview & {
    systemMetrics?: any;
    healthStatus?: 'healthy' | 'warning' | 'critical';
  };
  errors?: string[];
}

export class GetSystemOverviewUseCase {
  constructor(private saasAdminRepository: ISaasAdminRepository) {}

  async execute(request: GetSystemOverviewRequest): Promise<GetSystemOverviewResponse> {
    try {
      // Validate permissions
      if (!SaasAdminDomainService.hasSaasAdminPermission(request.adminRole)) {
        return {
          success: false,
          errors: ['Acesso negado. Permissões de SaaS Admin necessárias.']
        };
      }

      // Get or generate system overview
      let overview = await this.saasAdminRepository.getSystemOverview();
      
      if (!overview) {
        // Generate fresh overview if none exists
        overview = await this.generateSystemOverview();
      }

      // Get additional metrics
      const tenants = await this.saasAdminRepository.getAllTenants();
      const systemMetrics = SaasAdminDomainService.calculateSystemMetrics(tenants);
      
      // Determine health status
      const healthStatus = SaasAdminDomainService.validateSystemHealth(
        overview.systemLoad,
        overview.databaseConnections,
        overview.storageUsage
      );

      return {
        success: true,
        data: {
          ...overview,
          systemMetrics,
          healthStatus
        }
      };

    } catch (error) {
      console.error('[GetSystemOverviewUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }

  private async generateSystemOverview(): Promise<SystemOverview> {
    // Get real data from repositories
    const tenants = await this.saasAdminRepository.getAllTenants();
    const users = await this.saasAdminRepository.getAllUsers();
    const healthMetrics = await this.saasAdminRepository.getSystemHealthMetrics();

    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    
    // Calculate total tickets across all tenants
    const totalTickets = tenants.reduce((sum, tenant) => sum + tenant.ticketCount, 0);

    // Create system overview
    const overview: Omit<SystemOverview, 'id' | 'createdAt' | 'updatedAt'> = {
      totalTenants: tenants.length,
      activeTenants,
      totalUsers: users.length,
      activeUsers,
      totalTickets,
      systemHealth: SaasAdminDomainService.validateSystemHealth(
        healthMetrics.systemLoad,
        healthMetrics.databaseConnections,
        healthMetrics.diskUsage
      ),
      systemLoad: healthMetrics.systemLoad,
      databaseConnections: healthMetrics.databaseConnections,
      storageUsage: healthMetrics.diskUsage,
      bandwidth: Math.random() * 1000 + 500, // Mock - would get from CDN/hosting
      uptime: healthMetrics.uptime,
      lastHealthCheck: new Date()
    };

    return await this.saasAdminRepository.updateSystemOverview(overview);
  }
}