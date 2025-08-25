import { Request, Response } from 'express';
import { db } from '../../../../db.ts';
import { 
  approvalGroups, 
  approvalGroupMembers, 
  timecardApprovalSettings, 
  timecardApprovalHistory,
  timecardEntries,
  users 
} from '@shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { 
  InsertApprovalGroup, 
  InsertApprovalGroupMember, 
  InsertTimecardApprovalSettings,
  InsertTimecardApprovalHistory 
} from '@shared/schema';

export class TimecardApprovalController {
  // ========================================
  // APPROVAL GROUPS MANAGEMENT
  // ========================================

  getApprovalGroups = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;

      const groups = await db
        .select({
          id: approvalGroups.id,
          name: approvalGroups.name,
          description: approvalGroups.description,
          isActive: approvalGroups.isActive,
          createdAt: approvalGroups.createdAt
        })
        .from(approvalGroups)
        .where(and(
          eq(approvalGroups.tenantId, tenantId),
          eq(approvalGroups.isActive, true)
        ));

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        groups.map(async (group) => {
          const memberCount = await db
            .select({ count: sql<string>`count(*)` })
            .from(approvalGroupMembers)
            .where(and(
              eq(approvalGroupMembers.groupId, group.id),
              eq(approvalGroupMembers.isActive, true)
            ));
          
          return {
            ...group,
            memberCount: parseInt(memberCount[0]?.count as string) || 0
          };
        })
      );

      res.json({ groups: groupsWithCounts });
    } catch (error) {
      console.error('Error fetching approval groups:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  createApprovalGroup = async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = (req as any).user;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Nome do grupo é obrigatório' });
      }

      const groupData: InsertApprovalGroup = {
        tenantId,
        name,
        description,
        isActive: true
      };

      const [newGroup] = await db
        .insert(approvalGroups)
        .values(groupData)
        .returning();

      res.status(201).json({ group: newGroup });
    } catch (error) {
      console.error('Error creating approval group:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  updateApprovalGroup = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      const [updatedGroup] = await db
        .update(approvalGroups)
        .set({
          name,
          description,
          isActive,
          updatedAt: new Date()
        })
        .where(and(
          eq(approvalGroups.id, id),
          eq(approvalGroups.tenantId, tenantId)
        ))
        .returning();

      if (!updatedGroup) {
        return res.status(404).json({ message: 'Grupo não encontrado' });
      }

      res.json({ group: updatedGroup });
    } catch (error) {
      console.error('Error updating approval group:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  deleteApprovalGroup = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { id } = req.params;

      await db
        .update(approvalGroups)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(approvalGroups.id, id),
          eq(approvalGroups.tenantId, tenantId)
        ));

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting approval group:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // ========================================
  // GROUP MEMBERS MANAGEMENT
  // ========================================

  getGroupMembers = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { groupId } = req.params;

      console.log('Fetching members for group:', groupId, 'tenant:', tenantId);

      const { getTenantDb } = await import('../../../../db-tenant');
      const tenantDb = await getTenantDb(tenantId);
      
      // Use approvalGroupMembers table 
      const { approvalGroupMembers } = await import('@shared/schema');
      
      const members = await tenantDb
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role
        })
        .from(approvalGroupMembers)
        .innerJoin(users, eq(approvalGroupMembers.userId, users.id))
        .where(and(
          eq(approvalGroupMembers.groupId, groupId),
          eq(approvalGroupMembers.tenantId, tenantId),
          eq(approvalGroupMembers.isActive, true)
        ));

      console.log('Found members:', members.length);
      res.json({ members });
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  addGroupMember = async (req: Request, res: Response) => {
    try {
      const { tenantId, userId: currentUserId } = (req as any).user;
      const { groupId } = req.params;
      const { userIds } = req.body;

      console.log('Adding members to group:', groupId, 'userIds:', userIds);

      const { getTenantDb } = await import('../../../../db-tenant');
      const tenantDb = await getTenantDb(tenantId);
      
      const { approvalGroupMembers } = await import('@shared/schema');

      // Remove existing members first
      await tenantDb
        .delete(approvalGroupMembers)
        .where(and(
          eq(approvalGroupMembers.groupId, groupId),
          eq(approvalGroupMembers.tenantId, tenantId)
        ));

      // Add new members
      if (userIds && userIds.length > 0) {
        const membersToInsert = userIds.map((userId: string) => ({
          id: crypto.randomUUID(),
          groupId,
          userId,
          tenantId,
          role: 'member',
          isActive: true,
          addedAt: new Date(),
          addedBy: currentUserId
        }));

        await tenantDb.insert(approvalGroupMembers).values(membersToInsert);
        console.log('Added', membersToInsert.length, 'members to group');
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding group members:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  removeGroupMember = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;
      const { groupId, memberId } = req.params;

      const { getTenantDb } = await import('../../../../db-tenant');
      const tenantDb = await getTenantDb(tenantId);
      
      const { approvalGroupMembers } = await import('@shared/schema');

      await tenantDb
        .update(approvalGroupMembers)
        .set({ 
          isActive: false,
          addedAt: new Date()
        })
        .where(and(
          eq(approvalGroupMembers.id, memberId),
          eq(approvalGroupMembers.groupId, groupId),
          eq(approvalGroupMembers.tenantId, tenantId)
        ));

      res.status(204).send();
    } catch (error) {
      console.error('Error removing group member:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // ========================================
  // APPROVAL SETTINGS MANAGEMENT
  // ========================================

  getApprovalSettings = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;

      const [settings] = await db
        .select()
        .from(timecardApprovalSettings)
        .where(and(
          eq(timecardApprovalSettings.tenantId, tenantId),
          eq(timecardApprovalSettings.isActive, true)
        ));

      if (!settings) {
        // Return default settings if none exist
        return res.json({
          settings: {
            approvalType: 'manual',
            autoApproveComplete: false,
            autoApproveAfterHours: 24,
            requireApprovalFor: ['all'],
            defaultApprovers: [],
            approvalGroupId: null,
            createAutoTickets: false,
            ticketRecurrence: 'weekly',
            ticketDay: 1,
            ticketTime: '09:00',
            escalationRules: {},
            notificationSettings: {}
          }
        });
      }

      res.json({ settings });
    } catch (error) {
      console.error('Error fetching approval settings:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  updateApprovalSettings = async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = (req as any).user;
      const settingsData = req.body;

      console.log('Settings data received:', settingsData);
      console.log('Tenant ID:', tenantId);

      // Check if settings already exist
      const [existingSettings] = await db
        .select({ id: timecardApprovalSettings.id })
        .from(timecardApprovalSettings)
        .where(eq(timecardApprovalSettings.tenantId, tenantId));

      let result;

      if (existingSettings) {
        console.log('Updating existing settings:', existingSettings.id);
        // Update existing settings
        [result] = await db
          .update(timecardApprovalSettings)
          .set({
            approvalType: settingsData.approvalType,
            autoApproveComplete: settingsData.autoApproveComplete,
            autoApproveAfterHours: settingsData.autoApproveAfterHours,
            requireApprovalFor: settingsData.requireApprovalFor,
            defaultApprovers: Array.isArray(settingsData.defaultApprovers) ? settingsData.defaultApprovers : [],
            approvalGroupId: settingsData.approvalGroupId === 'none' ? null : settingsData.approvalGroupId,
            createAutoTickets: settingsData.createAutoTickets,
            ticketRecurrence: settingsData.ticketRecurrence,
            ticketDay: settingsData.ticketDay,
            ticketTime: settingsData.ticketTime,
            escalationRules: settingsData.escalationRules,
            notificationSettings: settingsData.notificationSettings,
            updatedBy: userId,
            updatedAt: new Date()
          })
          .where(eq(timecardApprovalSettings.id, existingSettings.id))
          .returning();
      } else {
        console.log('Creating new settings');
        // Create new settings
        const newSettings: InsertTimecardApprovalSettings = {
          tenantId,
          approvalType: settingsData.approvalType,
          autoApproveComplete: settingsData.autoApproveComplete,
          autoApproveAfterHours: settingsData.autoApproveAfterHours,
          requireApprovalFor: settingsData.requireApprovalFor,
          defaultApprovers: Array.isArray(settingsData.defaultApprovers) ? settingsData.defaultApprovers : [],
          approvalGroupId: settingsData.approvalGroupId === 'none' ? null : settingsData.approvalGroupId,
          createAutoTickets: settingsData.createAutoTickets,
          ticketRecurrence: settingsData.ticketRecurrence,
          ticketDay: settingsData.ticketDay,
          ticketTime: settingsData.ticketTime,
          escalationRules: settingsData.escalationRules,
          notificationSettings: settingsData.notificationSettings,
          createdBy: userId,
          isActive: true
        };

        [result] = await db
          .insert(timecardApprovalSettings)
          .values(newSettings)
          .returning();
      }

      console.log('Settings saved successfully:', result);
      res.json({ settings: result });
    } catch (error) {
      console.error('Error updating approval settings:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        message: 'Erro interno do servidor', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // APPROVAL ACTIONS
  // ========================================

  getPendingApprovals = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: userId } = (req as any).user;
      
      console.log('[PENDING-APPROVALS] User data from request:', { 
        tenantId, 
        userId,
        fullUser: (req as any).user 
      });

      // Get user's approval groups
      const userGroups = await db
        .select({ groupId: approvalGroupMembers.groupId })
        .from(approvalGroupMembers)
        .where(and(
          eq(approvalGroupMembers.userId, userId),
          eq(approvalGroupMembers.tenantId, tenantId),
          eq(approvalGroupMembers.isActive, true)
        ));

      const groupIds = userGroups.map(g => g.groupId);

      // Get approval settings
      const [settings] = await db
        .select()
        .from(timecardApprovalSettings)
        .where(eq(timecardApprovalSettings.tenantId, tenantId));

      // ✅ 1QA.MD: Usar schema correto do tenant para multi-tenancy
      const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
      console.log('[PENDING-APPROVALS] Using tenant schema:', tenantSchema);
      
      // Get pending timecard entries usando o schema correto do tenant
      const pendingEntries = await db.execute(sql`
        SELECT 
          te.id,
          te.user_id,
          te.check_in,
          te.check_out,
          te.status,
          te.created_at,
          COALESCE(u.first_name, '') as first_name,
          COALESCE(u.last_name, '') as last_name,
          u.email,
          te.notes,
          te.location,
          te.is_manual_entry
        FROM ${sql.identifier(tenantSchema)}.timecard_entries te
        LEFT JOIN ${sql.identifier(tenantSchema)}.users u ON te.user_id = u.id
        WHERE te.tenant_id = ${tenantId}
          AND te.status = 'pending'
        ORDER BY te.created_at DESC
      `);

      const pendingApprovals = pendingEntries.rows || [];

      // Filter based on approval settings and user permissions
      let filteredEntries = pendingApprovals;

      if (settings && userId) {
        // Check if user is a default approver
        const isDefaultApprover = settings.defaultApprovers?.includes(userId);
        
        // Check if user belongs to approval group
        const isInApprovalGroup = settings.approvalGroupId && groupIds.includes(settings.approvalGroupId);

        // User must be either default approver OR in approval group
        if (!isDefaultApprover && !isInApprovalGroup) {
          // User is not authorized to approve
          filteredEntries = [];
        }

        console.log('[PENDING-APPROVALS] User permissions check:', {
          userId,
          isDefaultApprover,
          userGroups: groupIds,
          approvalGroupId: settings?.approvalGroupId,
          isInApprovalGroup,
          pendingCount: pendingEntries.length,
          filteredCount: filteredEntries.length
        });
      }

      res.json({ pendingApprovals: filteredEntries });
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  approveTimecard = async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = (req as any).user;
      const { entryId } = req.params;
      const { comments } = req.body;

      // Update timecard entry status
      await db
        .update(timecardEntries)
        .set({
          status: 'approved',
          approvedBy: userId,
          updatedAt: new Date()
        })
        .where(and(
          eq(timecardEntries.id, entryId),
          eq(timecardEntries.tenantId, tenantId)
        ));

      // Create approval history record
      const historyData: InsertTimecardApprovalHistory = {
        tenantId,
        timecardEntryId: entryId,
        approvalStatus: 'approved',
        approvedBy: userId,
        approvalDate: new Date(),
        comments,
        approvalMethod: 'manual'
      };

      await db
        .insert(timecardApprovalHistory)
        .values(historyData);

      res.json({ message: 'Ponto aprovado com sucesso' });
    } catch (error) {
      console.error('Error approving timecard:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  rejectTimecard = async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = (req as any).user;
      const { entryId } = req.params;
      const { rejectionReason, comments } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ message: 'Motivo da rejeição é obrigatório' });
      }

      // Update timecard entry status
      await db
        .update(timecardEntries)
        .set({
          status: 'rejected',
          updatedAt: new Date()
        })
        .where(and(
          eq(timecardEntries.id, entryId),
          eq(timecardEntries.tenantId, tenantId)
        ));

      // Create approval history record
      const historyData: InsertTimecardApprovalHistory = {
        tenantId,
        timecardEntryId: entryId,
        approvalStatus: 'rejected',
        approvedBy: userId,
        approvalDate: new Date(),
        rejectionReason,
        comments,
        approvalMethod: 'manual'
      };

      await db
        .insert(timecardApprovalHistory)
        .values(historyData);

      res.json({ message: 'Ponto rejeitado com sucesso' });
    } catch (error) {
      console.error('Error rejecting timecard:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  bulkApproveTimecards = async (req: Request, res: Response) => {
    try {
      const { tenantId, userId } = (req as any).user;
      const { entryIds, comments } = req.body;

      if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return res.status(400).json({ message: 'Lista de registros é obrigatória' });
      }

      // Update all timecard entries
      await db
        .update(timecardEntries)
        .set({
          status: 'approved',
          approvedBy: userId,
          updatedAt: new Date()
        })
        .where(and(
          inArray(timecardEntries.id, entryIds),
          eq(timecardEntries.tenantId, tenantId)
        ));

      // Create approval history records
      const historyRecords = entryIds.map(entryId => ({
        tenantId,
        timecardEntryId: entryId,
        approvalStatus: 'approved' as const,
        approvedBy: userId,
        approvalDate: new Date(),
        comments,
        approvalMethod: 'manual' as const
      }));

      await db
        .insert(timecardApprovalHistory)
        .values(historyRecords);

      res.json({ 
        message: `${entryIds.length} registros aprovados com sucesso`
      });
    } catch (error) {
      console.error('Error bulk approving timecards:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // ========================================
  // UTILITY METHODS
  // ========================================

  getAvailableUsers = async (req: Request, res: Response) => {
    try {
      const { tenantId } = (req as any).user;

      const availableUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role
        })
        .from(users)
        .where(eq(users.tenantId, tenantId));

      res.json({ users: availableUsers });
    } catch (error) {
      console.error('Error fetching available users:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}