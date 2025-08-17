/**
 * IApprovalGroupRepository - Interface para repositório de grupos de aprovação
 * Seguindo Clean Architecture e padrões 1qa.md
 */

import { 
  ApprovalGroup, 
  ApprovalGroupMember,
  CreateApprovalGroupRequest,
  UpdateApprovalGroupRequest,
  AddGroupMemberRequest
} from '../entities/ApprovalGroup';

export interface IApprovalGroupRepository {
  // Grupos de Aprovação
  findById(id: string, tenantId: string): Promise<ApprovalGroup | undefined>;
  findByTenant(tenantId: string, filters?: {
    groupType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ groups: ApprovalGroup[]; total: number }>;
  
  create(request: CreateApprovalGroupRequest): Promise<ApprovalGroup>;
  update(request: UpdateApprovalGroupRequest): Promise<ApprovalGroup | undefined>;
  delete(id: string, tenantId: string): Promise<boolean>;
  
  // Membros dos Grupos
  findGroupMembers(groupId: string, tenantId: string): Promise<ApprovalGroupMember[]>;
  addMember(request: AddGroupMemberRequest): Promise<ApprovalGroupMember>;
  removeMember(groupId: string, memberId: string, tenantId: string): Promise<boolean>;
  
  // Consultas específicas
  findGroupsByMember(memberId: string, memberType: string, tenantId: string): Promise<ApprovalGroup[]>;
  countMembersByGroup(groupId: string, tenantId: string): Promise<number>;
}