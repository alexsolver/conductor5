
export interface Team {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
