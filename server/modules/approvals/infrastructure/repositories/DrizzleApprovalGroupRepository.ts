/**
 * DrizzleApprovalGroupRepository - Implementação do repositório de grupos de aprovação
 * Seguindo Clean Architecture e padrões 1qa.md com Drizzle ORM
 */

import { db } from '../../../../db';
import { 
  approvalGroups, 
  approvalGroupMembers
} from '@shared/schema-tenant';
import { 
  users,
  customers 
} from '@shared/schema-master';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  ApprovalGroup, 
  ApprovalGroupMember,
  CreateApprovalGroupRequest,
  UpdateApprovalGroupRequest,
  AddGroupMemberRequest
} from '../../domain/entities/ApprovalGroup';
import { IApprovalGroupRepository } from '../../domain/repositories/IApprovalGroupRepository';

export class DrizzleApprovalGroupRepository implements IApprovalGroupRepository {
  
  async findById(id: string, tenantId: string): Promise<ApprovalGroup | undefined> {
    const [group] = await db
      .select()
      .from(approvalGroups)
      .where(and(
        eq(approvalGroups.id, id),
        eq(approvalGroups.tenantId, tenantId)
      ));

    if (!group) return undefined;

    // Get members
    const members = await this.findGroupMembers(id, tenantId);

    return {
      id: group.id,
      tenantId: group.tenantId,
      name: group.name,
      description: group.description,
      groupType: group.groupType as any,
      isActive: group.isActive,
      createdById: group.createdById,
      updatedById: group.updatedById,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      members
    };
  }

  async findByTenant(tenantId: string, filters?: {
    groupType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ groups: ApprovalGroup[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions = [eq(approvalGroups.tenantId, tenantId)];

    if (filters?.groupType) {
      whereConditions.push(eq(approvalGroups.groupType, filters.groupType));
    }

    if (filters?.isActive !== undefined) {
      whereConditions.push(eq(approvalGroups.isActive, filters.isActive));
    }

    const [groups, totalResult] = await Promise.all([
      db
        .select()
        .from(approvalGroups)
        .where(and(...whereConditions))
        .orderBy(desc(approvalGroups.createdAt))
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(approvalGroups)
        .where(and(...whereConditions))
    ]);

    const total = totalResult[0]?.count || 0;

    // Get members for each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await this.findGroupMembers(group.id, tenantId);
        return {
          id: group.id,
          tenantId: group.tenantId,
          name: group.name,
          description: group.description,
          groupType: group.groupType as any,
          isActive: group.isActive,
          createdById: group.createdById,
          updatedById: group.updatedById,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
          members
        };
      })
    );

    return { groups: groupsWithMembers, total };
  }

  async create(request: CreateApprovalGroupRequest): Promise<ApprovalGroup> {
    const [group] = await db
      .insert(approvalGroups)
      .values({
        tenantId: request.tenantId,
        name: request.name,
        description: request.description,
        groupType: request.groupType,
        createdById: request.createdById,
        updatedById: request.createdById
      })
      .returning();

    return {
      id: group.id,
      tenantId: group.tenantId,
      name: group.name,
      description: group.description,
      groupType: group.groupType as any,
      isActive: group.isActive,
      createdById: group.createdById,
      updatedById: group.updatedById,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      members: []
    };
  }

  async update(request: UpdateApprovalGroupRequest): Promise<ApprovalGroup | undefined> {
    const [group] = await db
      .update(approvalGroups)
      .set({
        name: request.name,
        description: request.description,
        groupType: request.groupType,
        isActive: request.isActive,
        updatedById: request.updatedById,
        updatedAt: new Date()
      })
      .where(and(
        eq(approvalGroups.id, request.id),
        eq(approvalGroups.tenantId, request.tenantId)
      ))
      .returning();

    if (!group) return undefined;

    const members = await this.findGroupMembers(group.id, request.tenantId);

    return {
      id: group.id,
      tenantId: group.tenantId,
      name: group.name,
      description: group.description,
      groupType: group.groupType as any,
      isActive: group.isActive,
      createdById: group.createdById,
      updatedById: group.updatedById,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      members
    };
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(approvalGroups)
      .where(and(
        eq(approvalGroups.id, id),
        eq(approvalGroups.tenantId, tenantId)
      ));

    return result.rowCount > 0;
  }

  async findGroupMembers(groupId: string, tenantId: string): Promise<ApprovalGroupMember[]> {
    const members = await db
      .select({
        id: approvalGroupMembers.id,
        tenantId: approvalGroupMembers.tenantId,
        groupId: approvalGroupMembers.groupId,
        memberType: sql<string>`approval_group_members.member_type`,
        memberId: approvalGroupMembers.memberId,
        role: approvalGroupMembers.role,
        isActive: approvalGroupMembers.isActive,
        addedById: approvalGroupMembers.addedById,
        addedAt: approvalGroupMembers.addedAt,
        // Get member names from appropriate tables
        userName: users.firstName,
        userEmail: users.email,
        customerName: customers.firstName,
        customerEmail: customers.email
      })
      .from(approvalGroupMembers)
      .leftJoin(users, and(
        sql`approval_group_members.member_type = 'user'`,
        eq(approvalGroupMembers.memberId, users.id)
      ))
      .leftJoin(customers, and(
        sql`approval_group_members.member_type = 'customer'`,
        eq(approvalGroupMembers.memberId, customers.id)
      ))
      .where(and(
        eq(approvalGroupMembers.groupId, groupId),
        eq(approvalGroupMembers.tenantId, tenantId)
      ));

    return members.map(member => ({
      id: member.id,
      tenantId: member.tenantId,
      groupId: member.groupId,
      memberType: member.memberType as any,
      memberId: member.memberId,
      role: member.role || 'member',
      isActive: member.isActive,
      addedById: member.addedById,
      addedAt: member.addedAt,
      memberName: member.userName || member.customerName || 'Unknown',
      memberEmail: member.userEmail || member.customerEmail || ''
    }));
  }

  async addMember(request: AddGroupMemberRequest): Promise<ApprovalGroupMember> {
    const [member] = await db
      .insert(approvalGroupMembers)
      .values({
        tenantId: request.tenantId,
        groupId: request.groupId,
        memberType: request.memberType,
        memberId: request.memberId,
        role: request.role || 'member',
        addedById: request.addedById
      })
      .returning();

    return {
      id: member.id,
      tenantId: member.tenantId,
      groupId: member.groupId,
      memberType: request.memberType as any,
      memberId: member.memberId,
      role: member.role || 'member',
      isActive: member.isActive,
      addedById: member.addedById,
      addedAt: member.addedAt
    };
  }

  async removeMember(groupId: string, memberId: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(approvalGroupMembers)
      .where(and(
        eq(approvalGroupMembers.groupId, groupId),
        eq(approvalGroupMembers.memberId, memberId),
        eq(approvalGroupMembers.tenantId, tenantId)
      ));

    return result.rowCount > 0;
  }

  async findGroupsByMember(memberId: string, memberType: string, tenantId: string): Promise<ApprovalGroup[]> {
    const groupsData = await db
      .select({
        id: approvalGroups.id,
        tenantId: approvalGroups.tenantId,
        name: approvalGroups.name,
        description: approvalGroups.description,
        groupType: approvalGroups.groupType,
        isActive: approvalGroups.isActive,
        createdById: approvalGroups.createdById,
        updatedById: approvalGroups.updatedById,
        createdAt: approvalGroups.createdAt,
        updatedAt: approvalGroups.updatedAt
      })
      .from(approvalGroups)
      .innerJoin(approvalGroupMembers, eq(approvalGroups.id, approvalGroupMembers.groupId))
      .where(and(
        eq(approvalGroupMembers.memberId, memberId),
        sql`approval_group_members.member_type = ${memberType}`,
        eq(approvalGroups.tenantId, tenantId),
        eq(approvalGroups.isActive, true)
      ));

    return groupsData.map(group => ({
      id: group.id,
      tenantId: group.tenantId,
      name: group.name,
      description: group.description,
      groupType: group.groupType as any,
      isActive: group.isActive,
      createdById: group.createdById,
      updatedById: group.updatedById,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }));
  }

  async countMembersByGroup(groupId: string, tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvalGroupMembers)
      .where(and(
        eq(approvalGroupMembers.groupId, groupId),
        eq(approvalGroupMembers.tenantId, tenantId),
        eq(approvalGroupMembers.isActive, true)
      ));

    return result?.count || 0;
  }
}