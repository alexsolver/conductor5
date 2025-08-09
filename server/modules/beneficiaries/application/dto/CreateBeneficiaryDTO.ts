
export interface CreateBeneficiaryDTO {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  address?: string;
  tenantId: string;
}

export interface BeneficiaryResponseDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
