export interface Item {
  id: string;
  tenantId: string;
  active: boolean;
  type: string;
  name: string;
  integrationCode?: string | null;
  description?: string | null;
  measurementUnit?: string | null;
  maintenancePlan?: string | null;
  defaultChecklist?: any | null; // JSONB field
  status?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  groupName?: string | null;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  type: string;
  integrationCode?: string;
  measurementUnit?: string;
  maintenancePlan?: string;
  defaultChecklist?: any;
  status?: string;
  groupName?: string;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  id: string;
}

export interface ItemQueryOptions {
  limit?: number;
  offset?: number;
  search?: string;
  type?: string;
  status?: string;
  active?: boolean;
  companyId?: string;
}