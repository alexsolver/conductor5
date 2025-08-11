
/**
 * APPLICATION DTO - CREATE BENEFICIARY
 * Clean Architecture: Application layer data transfer object
 */

export interface CreateBeneficiaryDTO {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate?: string;
  rg?: string;
  cpfCnpj?: string;
  isActive?: boolean;
  customerCode?: string;
  customerId?: string;
  phone?: string;
  cellPhone?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface UpdateBeneficiaryDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  birthDate?: string;
  rg?: string;
  cpfCnpj?: string;
  isActive?: boolean;
  customerCode?: string;
  customerId?: string;
  phone?: string;
  cellPhone?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface GetBeneficiariesDTO {
  tenantId: string;
  search?: string;
  customerId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface BeneficiaryResponseDTO {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  birthDate?: string;
  rg?: string;
  cpfCnpj?: string;
  isActive: boolean;
  customerCode?: string;
  customerId?: string;
  phone?: string;
  cellPhone?: string;
  contactPerson?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}
