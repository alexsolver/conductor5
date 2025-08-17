/**
 * ApprovalGroup Domain Entity
 * Grupos de aprovação para organizar aprovadores (agentes, clientes, favorecidos)
 * Seguindo Clean Architecture e padrões 1qa.md
 */

export interface ApprovalGroup {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  groupType: 'agents' | 'clients' | 'beneficiaries' | 'mixed';
  isActive: boolean;
  createdById: string;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Navigation properties
  members?: ApprovalGroupMember[];
}

export interface ApprovalGroupMember {
  id: string;
  tenantId: string;
  groupId: string;
  memberType: 'user' | 'customer' | 'beneficiary';
  memberId: string;
  role: string;
  isActive: boolean;
  addedById: string;
  addedAt: Date;
  
  // Navigation properties (populated when needed)
  memberName?: string;
  memberEmail?: string;
}

export interface CreateApprovalGroupRequest {
  tenantId: string;
  name: string;
  description?: string;
  groupType: 'agents' | 'clients' | 'beneficiaries' | 'mixed';
  createdById: string;
}

export interface UpdateApprovalGroupRequest {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  groupType?: 'agents' | 'clients' | 'beneficiaries' | 'mixed';
  isActive?: boolean;
  updatedById: string;
}

export interface AddGroupMemberRequest {
  groupId: string;
  tenantId: string;
  memberType: 'user' | 'customer' | 'beneficiary';
  memberId: string;
  role?: string;
  addedById: string;
}