/**
 * ApprovalGroupController - Controlador para gerenciamento de grupos de aprovação
 * Seguindo Clean Architecture e padrões 1qa.md
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { IApprovalGroupRepository } from '../domain/repositories/IApprovalGroupRepository';
import { DrizzleApprovalGroupRepository } from '../infrastructure/repositories/DrizzleApprovalGroupRepository';

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  groupType: z.enum(['agents', 'clients', 'beneficiaries', 'mixed'])
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  groupType: z.enum(['agents', 'clients', 'beneficiaries', 'mixed']).optional(),
  isActive: z.boolean().optional()
});

const addMemberSchema = z.object({
  memberType: z.enum(['user', 'customer', 'beneficiary']),
  memberId: z.string().uuid(),
  role: z.string().optional()
});

export class ApprovalGroupController {
  private approvalGroupRepository: IApprovalGroupRepository;

  constructor() {
    this.approvalGroupRepository = new DrizzleApprovalGroupRepository();
  }

  /**
   * GET /api/approvals/groups
   * List approval groups with filtering
   */
  async listGroups(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      const { groupType, isActive, page, limit } = req.query;

      const filters = {
        groupType: groupType as string,
        isActive: isActive ? isActive === 'true' : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      };

      const result = await this.approvalGroupRepository.findByTenant(tenantId, filters);

      res.json({
        success: true,
        data: result.groups,
        total: result.total,
        page: filters.page,
        limit: filters.limit
      });
    } catch (error) {
      console.error('Error in listGroups:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/approvals/groups/:id
   * Get single approval group by ID
   */
  async getGroup(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      const group = await this.approvalGroupRepository.findById(id, tenantId);

      if (!group) {
        res.status(404).json({ error: 'Grupo de aprovação não encontrado' });
        return;
      }

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      console.error('Error in getGroup:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * POST /api/approvals/groups
   * Create new approval group
   */
  async createGroup(req: Request, res: Response): Promise<void> {
    console.log('🎯 [ApprovalGroupController] createGroup called');
    console.log('🎯 [ApprovalGroupController] req.body:', req.body);
    console.log('🎯 [ApprovalGroupController] req.user:', req.user);
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        console.error('❌ [ApprovalGroupController] No tenant or user ID');
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const validation = createGroupSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Dados inválidos',
          validationErrors: validation.error.errors
        });
        return;
      }

      const group = await this.approvalGroupRepository.create({
        tenantId,
        createdById: userId,
        ...validation.data
      });

      res.status(201).json({
        success: true,
        message: 'Grupo de aprovação criado com sucesso',
        data: group
      });
    } catch (error) {
      console.error('Error in createGroup:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * PUT /api/approvals/groups/:id
   * Update approval group
   */
  async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const validation = updateGroupSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Dados inválidos',
          validationErrors: validation.error.errors
        });
        return;
      }

      const group = await this.approvalGroupRepository.update({
        id,
        tenantId,
        updatedById: userId,
        ...validation.data
      });

      if (!group) {
        res.status(404).json({ error: 'Grupo de aprovação não encontrado' });
        return;
      }

      res.json({
        success: true,
        message: 'Grupo de aprovação atualizado com sucesso',
        data: group
      });
    } catch (error) {
      console.error('Error in updateGroup:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * DELETE /api/approvals/groups/:id
   * Delete approval group
   */
  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      const success = await this.approvalGroupRepository.delete(id, tenantId);

      if (!success) {
        res.status(404).json({ error: 'Grupo de aprovação não encontrado' });
        return;
      }

      res.json({
        success: true,
        message: 'Grupo de aprovação excluído com sucesso'
      });
    } catch (error) {
      console.error('Error in deleteGroup:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/approvals/groups/:id/members
   * Get group members
   */
  async getGroupMembers(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      const members = await this.approvalGroupRepository.findGroupMembers(id, tenantId);

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      console.error('Error in getGroupMembers:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * POST /api/approvals/groups/:id/members
   * Add member to group
   */
  async addGroupMember(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { id: groupId } = req.params;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const validation = addMemberSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Dados inválidos',
          validationErrors: validation.error.errors
        });
        return;
      }

      const member = await this.approvalGroupRepository.addMember({
        groupId,
        tenantId,
        addedById: userId,
        ...validation.data
      });

      res.status(201).json({
        success: true,
        message: 'Membro adicionado ao grupo com sucesso',
        data: member
      });
    } catch (error) {
      console.error('Error in addGroupMember:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * DELETE /api/approvals/groups/:groupId/members/:memberId
   * Remove member from group
   */
  async removeGroupMember(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { groupId, memberId } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant não identificado' });
        return;
      }

      const success = await this.approvalGroupRepository.removeMember(groupId, memberId, tenantId);

      if (!success) {
        res.status(404).json({ error: 'Membro não encontrado no grupo' });
        return;
      }

      res.json({
        success: true,
        message: 'Membro removido do grupo com sucesso'
      });
    } catch (error) {
      console.error('Error in removeGroupMember:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}