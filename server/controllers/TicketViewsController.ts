import { Request, Response } from 'express';
import { TicketViewsRepository } from '../repositories/TicketViewsRepository';
import { pool } from '../db';
import { insertTicketListViewSchema } from '@shared/schema';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email?: string;
    role?: string;
    roles?: string[];
  };
}

export class TicketViewsController {
  private ticketViewsRepository: TicketViewsRepository;

  constructor() {
    this.ticketViewsRepository = new TicketViewsRepository(pool);
  }

  // ========================================
  // GET /api/ticket-views - Listar visualizações
  // ========================================
  async getViews(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, id: userId, role = 'user' } = req.user!;
      
      const views = await this.ticketViewsRepository.getViewsForUser(tenantId, userId, role);
      
      // Se não há views, criar visualização padrão
      if (views.length === 0) {
        const defaultView = await this.ticketViewsRepository.createDefaultView(tenantId, userId);
        views.push(defaultView);
      }

      res.json({
        success: true,
        data: views
      });
    } catch (error) {
      console.error('Error fetching ticket views:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar visualizações'
      });
    }
  }

  // ========================================
  // GET /api/ticket-views/:id - Buscar visualização específica
  // ========================================
  async getViewById(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      const view = await this.ticketViewsRepository.getViewById(tenantId, id);
      
      if (!view) {
        return res.status(404).json({
          success: false,
          message: 'Visualização não encontrada'
        });
      }

      res.json({
        success: true,
        data: view
      });
    } catch (error) {
      console.error('Error fetching ticket view:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar visualização'
      });
    }
  }

  // ========================================
  // POST /api/ticket-views - Criar nova visualização
  // ========================================
  async createView(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, id: userId, role = 'user' } = req.user!;
      
      // Validar dados de entrada
      const validationResult = insertTicketListViewSchema.safeParse({
        ...req.body,
        tenantId,
        createdById: userId
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validationResult.error.errors
        });
      }

      const viewData = validationResult.data;

      // Verificar permissões para views públicas
      const isAdmin = role === 'tenant_admin' || role === 'saas_admin';
      if (viewData.isPublic && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores podem criar visualizações públicas'
        });
      }

      const view = await this.ticketViewsRepository.createView(tenantId, viewData);

      res.status(201).json({
        success: true,
        data: view,
        message: 'Visualização criada com sucesso'
      });
    } catch (error) {
      console.error('Error creating ticket view:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar visualização'
      });
    }
  }

  // ========================================
  // PUT /api/ticket-views/:id - Atualizar visualização
  // ========================================
  async updateView(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, id: userId, role = 'user' } = req.user!;
      const { id } = req.params;

      console.log('🔧 [UPDATE-VIEW] Request details:', {
        tenantId,
        userId,
        role,
        viewId: id,
        body: req.body
      });

      // Buscar visualização existente
      const existingView = await this.ticketViewsRepository.getViewById(tenantId, id);
      
      console.log('🔧 [UPDATE-VIEW] Existing view:', existingView);
      
      if (!existingView) {
        return res.status(404).json({
          success: false,
          message: 'Visualização não encontrada'
        });
      }

      // Verificar permissões (o banco retorna created_by_id em snake_case)
      const viewCreatorId = (existingView as any).created_by_id;
      const isAdmin = role === 'tenant_admin' || role === 'saas_admin';
      const canEdit = viewCreatorId === userId || isAdmin;
      
      console.log('🔧 [UPDATE-VIEW] Permission check:', {
        viewCreatorId,
        currentUserId: userId,
        role,
        isAdmin,
        canEdit
      });
      
      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para editar esta visualização'
        });
      }

      // Verificar permissões para tornar públicas
      if (req.body.isPublic && !isAdmin) {
        console.log('🔧 [UPDATE-VIEW] Rejected: trying to make public without admin role');
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores podem criar visualizações públicas'
        });
      }

      const view = await this.ticketViewsRepository.updateView(tenantId, id, req.body);

      res.json({
        success: true,
        data: view,
        message: 'Visualização atualizada com sucesso'
      });
    } catch (error) {
      console.error('Error updating ticket view:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar visualização'
      });
    }
  }

  // ========================================
  // DELETE /api/ticket-views/:id - Deletar visualização
  // ========================================
  async deleteView(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, id: userId, role = 'user' } = req.user!;
      const { id } = req.params;

      console.log('🗑️ [DELETE-VIEW] Delete request:', {
        tenantId,
        userId,
        role,
        viewId: id,
        timestamp: new Date().toISOString()
      });

      // First, check if view exists and get its details
      const existingView = await this.ticketViewsRepository.getViewById(tenantId, id);
      
      console.log('🗑️ [DELETE-VIEW] View found:', existingView ? {
        id: existingView.id,
        name: existingView.name,
        createdById: (existingView as any).created_by_id,
        isPublic: (existingView as any).is_public
      } : 'NOT FOUND');

      if (!existingView) {
        console.log('🗑️ [DELETE-VIEW] View not found:', id);
        return res.status(404).json({
          success: false,
          message: 'Visualização não encontrada'
        });
      }

      // Check permissions before attempting delete
      const viewCreatorId = (existingView as any).created_by_id;
      const isAdmin = role === 'tenant_admin' || role === 'saas_admin';
      const canDelete = viewCreatorId === userId || isAdmin;
      
      console.log('🗑️ [DELETE-VIEW] Permission check:', {
        viewCreatorId,
        currentUserId: userId,
        userRole: role,
        isAdmin,
        canDelete
      });

      if (!canDelete) {
        console.log('🗑️ [DELETE-VIEW] Permission denied');
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para deletar esta visualização'
        });
      }

      const success = await this.ticketViewsRepository.deleteView(tenantId, id, userId, role);
      
      console.log('🗑️ [DELETE-VIEW] Delete result:', { success });

      if (!success) {
        console.log('🗑️ [DELETE-VIEW] Delete failed');
        return res.status(404).json({
          success: false,
          message: 'Visualização não encontrada ou sem permissão'
        });
      }

      console.log('🗑️ [DELETE-VIEW] View deleted successfully:', id);
      res.json({
        success: true,
        message: 'Visualização removida com sucesso'
      });
    } catch (error) {
      console.error('❌ [DELETE-VIEW] Error deleting ticket view:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover visualização'
      });
    }
  }

  // ========================================
  // POST /api/ticket-views/:id/set-active - Definir visualização ativa
  // ========================================
  async setActiveView(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const { id } = req.params;

      // Verificar se a visualização existe
      const view = await this.ticketViewsRepository.getViewById(tenantId, id);
      if (!view) {
        return res.status(404).json({
          success: false,
          message: 'Visualização não encontrada'
        });
      }

      const preference = await this.ticketViewsRepository.setUserActiveView(tenantId, userId, id);

      res.json({
        success: true,
        data: preference,
        message: 'Visualização ativa definida com sucesso'
      });
    } catch (error) {
      console.error('Error setting active view:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao definir visualização ativa'
      });
    }
  }

  // ========================================
  // GET /api/ticket-views/user/preferences - Buscar preferências do usuário
  // ========================================
  async getUserPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;

      const preferences = await this.ticketViewsRepository.getUserPreferences(tenantId, userId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar preferências do usuário'
      });
    }
  }

  // ========================================
  // PUT /api/ticket-views/user/settings - Atualizar configurações pessoais
  // ========================================
  async updatePersonalSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, id: userId } = req.user!;
      const { settings } = req.body;

      const preference = await this.ticketViewsRepository.updatePersonalSettings(tenantId, userId, settings);

      res.json({
        success: true,
        data: preference,
        message: 'Configurações pessoais atualizadas com sucesso'
      });
    } catch (error) {
      console.error('Error updating personal settings:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configurações pessoais'
      });
    }
  }
}