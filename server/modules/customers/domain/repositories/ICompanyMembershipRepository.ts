
export interface ICompanyMembershipRepository {
  create(membership: CompanyMembership): Promise<CompanyMembership>;
  findById(id: string): Promise<CompanyMembership | null>;
  findByCompanyId(companyId: string): Promise<CompanyMembership[]>;
  update(id: string, membership: Partial<CompanyMembership>): Promise<CompanyMembership>;
  delete(id: string): Promise<void>;
}

export interface CompanyMembership {
  id: string;
  companyId: string;
  userId: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}
