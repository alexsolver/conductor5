
export interface CreateSaasConfigDTO {
  configKey: string;
  configValue: any;
  description?: string;
  isActive: boolean;
  tenantId: string;
}

export interface UpdateSaasConfigDTO {
  configValue?: any;
  description?: string;
  isActive?: boolean;
}
