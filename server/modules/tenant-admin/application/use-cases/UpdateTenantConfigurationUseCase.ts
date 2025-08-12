/**
 * Update Tenant Configuration Use Case
 * Clean Architecture - Application Layer
 * 
 * @module UpdateTenantConfigurationUseCase
 * @created 2025-08-12 - Phase 22 Clean Architecture Implementation
 */

import { ITenantAdminRepository } from '../../domain/repositories/ITenantAdminRepository';
import { TenantConfiguration, TenantAdminDomainService } from '../../domain/entities/TenantAdmin';

export interface UpdateTenantConfigurationRequest {
  tenantId: string;
  adminUserId: string;
  userRole: string;
  configuration: Partial<TenantConfiguration>;
  createBackup?: boolean;
  validateOnly?: boolean;
}

export interface UpdateTenantConfigurationResponse {
  success: boolean;
  data?: {
    configuration: TenantConfiguration;
    backupId?: string;
    validationResults: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
    changesSummary: string[];
  };
  errors?: string[];
  warnings?: string[];
}

export class UpdateTenantConfigurationUseCase {
  constructor(private tenantAdminRepository: ITenantAdminRepository) {}

  async execute(request: UpdateTenantConfigurationRequest): Promise<UpdateTenantConfigurationResponse> {
    try {
      // 1. Get current tenant admin
      const tenantAdmin = await this.tenantAdminRepository.findByTenantId(request.tenantId);
      
      if (!tenantAdmin) {
        return {
          success: false,
          errors: ['Tenant admin configuration not found']
        };
      }

      // 2. Check permissions
      if (!this.hasUpdatePermission(tenantAdmin.adminUserId, request.userRole, request.adminUserId)) {
        return {
          success: false,
          errors: ['Insufficient permissions to update tenant configuration']
        };
      }

      // 3. Validate configuration
      const validationResults = await this.tenantAdminRepository.validateConfiguration(
        request.tenantId,
        request.configuration
      );

      if (request.validateOnly) {
        return {
          success: true,
          data: {
            configuration: tenantAdmin.configuration,
            validationResults,
            changesSummary: this.generateChangesSummary(tenantAdmin.configuration, request.configuration)
          }
        };
      }

      if (!validationResults.isValid) {
        return {
          success: false,
          errors: validationResults.errors,
          warnings: validationResults.warnings
        };
      }

      // 4. Create backup if requested
      let backupId: string | undefined;
      if (request.createBackup) {
        try {
          const backup = await this.tenantAdminRepository.backupConfiguration(request.tenantId);
          backupId = backup.backupId;
        } catch (error) {
          console.warn('[UpdateTenantConfigurationUseCase] Backup failed:', error);
          // Continue with update but warn about backup failure
        }
      }

      // 5. Merge with existing configuration
      const updatedConfiguration = this.mergeConfigurations(
        tenantAdmin.configuration,
        request.configuration
      );

      // 6. Additional validation using domain service
      const domainValidation = TenantAdminDomainService.validateTenantConfiguration(updatedConfiguration);
      
      if (!domainValidation.isValid) {
        return {
          success: false,
          errors: domainValidation.errors,
          warnings: domainValidation.warnings
        };
      }

      // 7. Update configuration
      const updateSuccess = await this.tenantAdminRepository.updateConfiguration(
        request.tenantId,
        updatedConfiguration
      );

      if (!updateSuccess) {
        return {
          success: false,
          errors: ['Failed to update tenant configuration']
        };
      }

      // 8. Get updated tenant admin
      const updatedTenantAdmin = await this.tenantAdminRepository.findByTenantId(request.tenantId);
      
      if (!updatedTenantAdmin) {
        return {
          success: false,
          errors: ['Failed to retrieve updated configuration']
        };
      }

      // 9. Generate changes summary
      const changesSummary = this.generateChangesSummary(
        tenantAdmin.configuration,
        updatedTenantAdmin.configuration
      );

      return {
        success: true,
        data: {
          configuration: updatedTenantAdmin.configuration,
          backupId,
          validationResults: domainValidation,
          changesSummary
        },
        warnings: domainValidation.warnings
      };

    } catch (error) {
      console.error('[UpdateTenantConfigurationUseCase] Error:', error);
      return {
        success: false,
        errors: ['Internal server error']
      };
    }
  }

  private hasUpdatePermission(tenantOwnerId: string, userRole: string, adminUserId: string): boolean {
    // SaaS admin has full access
    if (userRole === 'saas_admin') {
      return true;
    }

    // Tenant owner can update their own configuration
    if (tenantOwnerId === adminUserId) {
      return true;
    }

    // Other roles need specific permissions (would be checked by domain service in real implementation)
    return ['tenant_admin', 'tenant_manager'].includes(userRole);
  }

  private mergeConfigurations(
    current: TenantConfiguration,
    updates: Partial<TenantConfiguration>
  ): TenantConfiguration {
    const merged = { ...current };

    // Deep merge for complex objects
    if (updates.general) {
      merged.general = { ...merged.general, ...updates.general };
    }

    if (updates.features) {
      merged.features = {
        ...merged.features,
        ...updates.features,
        modules: { ...merged.features.modules, ...updates.features.modules },
        limits: { ...merged.features.limits, ...updates.features.limits }
      };
    }

    if (updates.security) {
      merged.security = {
        ...merged.security,
        ...updates.security,
        authentication: { ...merged.security.authentication, ...updates.security.authentication },
        authorization: { ...merged.security.authorization, ...updates.security.authorization },
        encryption: { ...merged.security.encryption, ...updates.security.encryption },
        audit: { ...merged.security.audit, ...updates.security.audit },
        compliance: { ...merged.security.compliance, ...updates.security.compliance }
      };
    }

    if (updates.integration) {
      merged.integration = {
        ...merged.integration,
        ...updates.integration,
        api: { ...merged.integration.api, ...updates.integration.api },
        webhooks: { ...merged.integration.webhooks, ...updates.integration.webhooks },
        sso: { ...merged.integration.sso, ...updates.integration.sso }
      };
    }

    if (updates.customization) {
      merged.customization = {
        ...merged.customization,
        ...updates.customization,
        branding: { ...merged.customization.branding, ...updates.customization.branding },
        ui: { ...merged.customization.ui, ...updates.customization.ui }
      };
    }

    if (updates.compliance) {
      merged.compliance = { ...merged.compliance, ...updates.compliance };
    }

    return merged;
  }

  private generateChangesSummary(
    before: TenantConfiguration,
    after: TenantConfiguration
  ): string[] {
    const changes: string[] = [];

    // General configuration changes
    if (before.general.tenantName !== after.general.tenantName) {
      changes.push(`Tenant name changed from "${before.general.tenantName}" to "${after.general.tenantName}"`);
    }

    if (before.general.timezone !== after.general.timezone) {
      changes.push(`Timezone changed from "${before.general.timezone}" to "${after.general.timezone}"`);
    }

    if (before.general.currency !== after.general.currency) {
      changes.push(`Currency changed from "${before.general.currency}" to "${after.general.currency}"`);
    }

    // Feature changes
    const moduleChanges = this.compareObjects(before.features.modules, after.features.modules);
    moduleChanges.forEach(change => changes.push(`Module ${change}`));

    const limitChanges = this.compareObjects(before.features.limits, after.features.limits);
    limitChanges.forEach(change => changes.push(`Limit ${change}`));

    // Security changes
    if (before.security.authentication.requireMFA !== after.security.authentication.requireMFA) {
      const status = after.security.authentication.requireMFA ? 'enabled' : 'disabled';
      changes.push(`Multi-factor authentication ${status}`);
    }

    if (before.security.encryption.encryptionLevel !== after.security.encryption.encryptionLevel) {
      changes.push(`Encryption level changed from "${before.security.encryption.encryptionLevel}" to "${after.security.encryption.encryptionLevel}"`);
    }

    // Customization changes
    if (before.customization.branding.primaryColor !== after.customization.branding.primaryColor) {
      changes.push(`Primary color changed from "${before.customization.branding.primaryColor}" to "${after.customization.branding.primaryColor}"`);
    }

    if (before.customization.ui.theme !== after.customization.ui.theme) {
      changes.push(`Theme changed from "${before.customization.ui.theme}" to "${after.customization.ui.theme}"`);
    }

    return changes;
  }

  private compareObjects(before: any, after: any): string[] {
    const changes: string[] = [];
    
    for (const key in after) {
      if (before[key] !== after[key]) {
        if (typeof after[key] === 'boolean') {
          const status = after[key] ? 'enabled' : 'disabled';
          changes.push(`${key} ${status}`);
        } else {
          changes.push(`${key} changed from "${before[key]}" to "${after[key]}"`);
        }
      }
    }

    return changes;
  }
}