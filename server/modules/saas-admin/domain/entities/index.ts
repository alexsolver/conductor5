// Domain entities for SaaS Admin module
export interface SaasAdminEntity {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaasConfiguration extends SaasAdminEntity {
  configKey: string;
  configValue: string;
  description?: string;
}

// Domain entities should be framework-agnostic

export * from './SaasConfig';