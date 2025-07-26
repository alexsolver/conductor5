/**
 * TicketHierarchicalController - Gerencia hierarquia de categorias (Categoria → Subcategoria → Ação)
 * Sistema completo para configuração hierárquica de tickets com três níveis
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { TicketHierarchicalService } from './TicketHierarchicalService';
import { z } from 'zod';

export class TicketHierarchicalController {
  private hierarchicalService: TicketHierarchicalService;

  constructor() {
    this.hierarchicalService = new TicketHierarchicalService();
  }

  // ============================================
  // CATEGORIES (Nível 1)
  // ============================================

  async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const customerId = req.query.customerId as string;

      console.log(`🏷️ [Categories] Getting categories for tenant ${tenantId}, customer ${customerId || 'all'}`);

      const categories = await this.hierarchicalService.getCategories(tenantId, customerId);
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get categories',
        details: error.message
      });
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const categoryData = {
        ...req.body,
        tenantId
      };

      console.log(`🆕 [Categories] Creating category:`, categoryData);

      const category = await this.hierarchicalService.createCategory(categoryData);
      
      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create category',
        details: error.message
      });
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const updateData = req.body;

      console.log(`✏️ [Categories] Updating category ${id}:`, updateData);

      const category = await this.hierarchicalService.updateCategory(id, updateData, tenantId);
      
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update category',
        details: error.message
      });
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      console.log(`🗑️ [Categories] Deleting category ${id}`);

      await this.hierarchicalService.deleteCategory(id, tenantId);
      
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete category',
        details: error.message
      });
    }
  }

  // ============================================
  // SUBCATEGORIES (Nível 2)
  // ============================================

  async getSubcategories(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { categoryId } = req.params;
      const customerId = req.query.customerId as string;

      console.log(`🏷️ [Subcategories] Getting subcategories for category ${categoryId}, customer ${customerId || 'all'}`);

      const subcategories = await this.hierarchicalService.getSubcategories(tenantId, categoryId, customerId);
      
      res.json({
        success: true,
        data: subcategories
      });
    } catch (error) {
      console.error('Error getting subcategories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get subcategories',
        details: error.message
      });
    }
  }

  async createSubcategory(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { categoryId } = req.params;
      const subcategoryData = {
        ...req.body,
        tenantId,
        categoryId
      };

      console.log(`🆕 [Subcategories] Creating subcategory:`, subcategoryData);

      const subcategory = await this.hierarchicalService.createSubcategory(subcategoryData);
      
      res.status(201).json({
        success: true,
        data: subcategory
      });
    } catch (error) {
      console.error('Error creating subcategory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create subcategory',
        details: error.message
      });
    }
  }

  async updateSubcategory(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const updateData = req.body;

      console.log(`✏️ [Subcategories] Updating subcategory ${id}:`, updateData);

      const subcategory = await this.hierarchicalService.updateSubcategory(id, updateData, tenantId);
      
      res.json({
        success: true,
        data: subcategory
      });
    } catch (error) {
      console.error('Error updating subcategory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update subcategory',
        details: error.message
      });
    }
  }

  async deleteSubcategory(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      console.log(`🗑️ [Subcategories] Deleting subcategory ${id}`);

      await this.hierarchicalService.deleteSubcategory(id, tenantId);
      
      res.json({
        success: true,
        message: 'Subcategory deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete subcategory',
        details: error.message
      });
    }
  }

  // ============================================
  // ACTIONS (Nível 3)
  // ============================================

  async getActions(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { subcategoryId } = req.params;
      const customerId = req.query.customerId as string;

      console.log(`🏷️ [Actions] Getting actions for subcategory ${subcategoryId}, customer ${customerId || 'all'}`);

      const actions = await this.hierarchicalService.getActions(tenantId, subcategoryId, customerId);
      
      res.json({
        success: true,
        data: actions
      });
    } catch (error) {
      console.error('Error getting actions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get actions',
        details: error.message
      });
    }
  }

  async createAction(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { subcategoryId } = req.params;
      const actionData = {
        ...req.body,
        tenantId,
        subcategoryId
      };

      console.log(`🆕 [Actions] Creating action:`, actionData);

      const action = await this.hierarchicalService.createAction(actionData);
      
      res.status(201).json({
        success: true,
        data: action
      });
    } catch (error) {
      console.error('Error creating action:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create action',
        details: error.message
      });
    }
  }

  async updateAction(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const updateData = req.body;

      console.log(`✏️ [Actions] Updating action ${id}:`, updateData);

      const action = await this.hierarchicalService.updateAction(id, updateData, tenantId);
      
      res.json({
        success: true,
        data: action
      });
    } catch (error) {
      console.error('Error updating action:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update action',
        details: error.message
      });
    }
  }

  async deleteAction(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      console.log(`🗑️ [Actions] Deleting action ${id}`);

      await this.hierarchicalService.deleteAction(id, tenantId);
      
      res.json({
        success: true,
        message: 'Action deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete action',
        details: error.message
      });
    }
  }

  // ============================================
  // HIERARCHY VISUALIZATION
  // ============================================

  async getFullHierarchy(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const customerId = req.query.customerId as string;

      console.log(`🌳 [Hierarchy] Getting full hierarchy for tenant ${tenantId}, customer ${customerId || 'all'}`);

      const hierarchy = await this.hierarchicalService.getFullHierarchy(tenantId, customerId);
      
      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      console.error('Error getting hierarchy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get hierarchy',
        details: error.message
      });
    }
  }
}