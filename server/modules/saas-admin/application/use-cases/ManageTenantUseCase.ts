/**
 * Manage Tenant Use Case
 * Clean Architecture - Application Layer
 * 
 * @module ManageTenantUseCase
 * @created 2025-08-12 - Phase 18 Clean Architecture Implementation
 */

import { ISaasAdminRepository } from '../../domain/repositories/ISaasAdminRepository';
import { TenantManagement, SaasAdminDomainService, SystemAudit } from '../../domain/entities/SaasAdmin';

export interface ManageTenantRequest {
  adminId: string;
  adminEmail: string;
  adminRole: string;
  tenantId: string;
  action: 'update' | 'suspend' | 'activate' | 'delete';
  updates?: Partial<TenantManagement>;
  reason?: string;
  ipAddress: string;
  userAgent: string;
}

export interface ManageTenantResponse {
  success: boolean;
  data?: TenantManagement;
  message?: string;
  errors?: string[];
}

export class ManageTenantUseCase {
  constructor(private saasAdminRepository: ISaasAdminRepository) {}

  async execute(request: ManageTenantRequest): Promise<ManageTenantResponse> {
    try {
      // Validate permissions
      if (!SaasAdminDomainService.hasSaasAdminPermission(request.adminRole)) {
        return {
          success: false,
          errors: ['Acesso negado. Permissões de SaaS Admin necessárias.']
        };
      }

      // Get existing tenant
      const existingTenant = await this.saasAdminRepository.getTenantById(request.tenantId);
      if (!existingTenant) {
        return {
          success: false,
          errors: ['Tenant não encontrado']
        };
      }

      let result: TenantManagement | null = null;
      let message = '';
      let auditAction = '';

      switch (request.action) {
        case 'update':
          if (!request.updates) {
            return {
              success: false,
              errors: ['Dados de atualização são obrigatórios']
            };
          }
          
          result = await this.saasAdminRepository.updateTenant(request.tenantId, request.updates);
          message = 'Tenant atualizado com sucesso';
          auditAction = 'update_tenant';
          break;

        case 'suspend':
          const suspendSuccess = await this.saasAdminRepository.suspendTenant(
            request.tenantId,
            request.reason || 'Suspenso pelo administrador',
            request.adminId
          );
          
          if (suspendSuccess) {
            result = await this.saasAdminRepository.getTenantById(request.tenantId);
            message = 'Tenant suspenso com sucesso';
            auditAction = 'suspend_tenant';
          }
          break;

        case 'activate':
          const activateSuccess = await this.saasAdminRepository.activateTenant(
            request.tenantId,
            request.adminId
          );
          
          if (activateSuccess) {
            result = await this.saasAdminRepository.getTenantById(request.tenantId);
            message = 'Tenant ativado com sucesso';
            auditAction = 'activate_tenant';
          }
          break;

        case 'delete':
          const deleteSuccess = await this.saasAdminRepository.deleteTenant(
            request.tenantId,
            request.adminId
          );
          
          if (deleteSuccess) {
            message = 'Tenant excluído com sucesso';
            auditAction = 'delete_tenant';
          }
          break;

        default:
          return {
            success: false,
            errors: ['Ação inválida']
          };
      }

      // Create audit entry
      const severity = SaasAdminDomainService.calculateAuditSeverity(auditAction, 'tenant');
      await this.saasAdminRepository.createAuditEntry({
        adminId: request.adminId,
        adminEmail: request.adminEmail,
        action: auditAction,
        entityType: 'tenant',
        entityId: request.tenantId,
        details: `${message}. Motivo: ${request.reason || 'N/A'}`,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        changes: request.action === 'update' ? {
          before: existingTenant,
          after: result || {}
        } : undefined,
        severity,
        isActive: true
      });

      if (request.action === 'delete') {
        return {
          success: true,
          message
        };
      }

      if (!result) {
        return {
          success: false,
          errors: ['Falha ao executar ação no tenant']
        };
      }

      return {
        success: true,
        data: result,
        message
      };

    } catch (error) {
      console.error('[ManageTenantUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}