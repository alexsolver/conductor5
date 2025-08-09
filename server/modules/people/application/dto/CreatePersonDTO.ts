
export interface CreatePersonDTO {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  skills?: string[];
  isActive: boolean;
}
