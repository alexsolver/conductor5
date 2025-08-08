
export interface CustomerResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  customerType: 'PF' | 'PJ';
  cpf?: string;
  cnpj?: string;
  companyName?: string;
  contactPerson?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  status: 'active' | 'inactive' | 'Ativo' | 'Inativo';
  isActive: boolean;
  verified: boolean;
  tags: string[];
  metadata: Record<string, any>;
  associatedCompanies?: string[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponseDTO {
  customers: CustomerResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  metadata: {
    tenant_id: string;
    schema: string;
    available_columns: string[];
    timestamp: string;
  };
}

// Transform raw database result to DTO
export const transformToCustomerDTO = (rawCustomer: any): CustomerResponseDTO => {
  return {
    id: rawCustomer.id,
    firstName: rawCustomer.first_name || rawCustomer.firstName || '',
    lastName: rawCustomer.last_name || rawCustomer.lastName || '',
    fullName: `${rawCustomer.first_name || ''} ${rawCustomer.last_name || ''}`.trim(),
    email: rawCustomer.email || '',
    phone: rawCustomer.phone || null,
    mobilePhone: rawCustomer.mobile_phone || rawCustomer.mobilePhone || null,
    customerType: rawCustomer.customer_type || rawCustomer.customerType || 'PF',
    cpf: rawCustomer.cpf || null,
    cnpj: rawCustomer.cnpj || null,
    companyName: rawCustomer.company_name || rawCustomer.companyName || null,
    contactPerson: rawCustomer.contact_person || rawCustomer.contactPerson || null,
    address: {
      street: rawCustomer.address || null,
      number: rawCustomer.address_number || null,
      complement: rawCustomer.complement || null,
      neighborhood: rawCustomer.neighborhood || null,
      city: rawCustomer.city || null,
      state: rawCustomer.state || null,
      zipCode: rawCustomer.zip_code || null,
    },
    status: rawCustomer.is_active ? 'active' : 'inactive',
    isActive: rawCustomer.is_active ?? true,
    verified: rawCustomer.verified ?? false,
    tags: rawCustomer.tags || [],
    metadata: rawCustomer.metadata || {},
    associatedCompanies: rawCustomer.associated_companies ? 
      rawCustomer.associated_companies.split(', ') : [],
    tenantId: rawCustomer.tenant_id || rawCustomer.tenantId,
    createdAt: rawCustomer.created_at || rawCustomer.createdAt,
    updatedAt: rawCustomer.updated_at || rawCustomer.updatedAt,
  };
};
