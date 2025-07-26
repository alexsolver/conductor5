import { Request, Response } from 'express';
import { FieldLayoutRepository } from './FieldLayoutRepository';
import { AuthenticatedRequest } from '../../middleware/jwtAuth';
import { Pool } from 'pg';
import { ModuleType, PageType } from '../../../shared/schema-field-layout';

export class FieldLayoutController {
  private repository: FieldLayoutRepository;

  constructor(pool: Pool) {
    this.repository = new FieldLayoutRepository(pool);
  }

  // ===========================
  // PAGE LAYOUTS ENDPOINTS
  // ===========================

  async getModuleLayouts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { moduleType } = req.params;
      const { pageType } = req.query;
      const tenantId = req.user!.tenantId;

      const layouts = await this.repository.getLayoutsForModule(
        tenantId, 
        moduleType as ModuleType,
        pageType as PageType
      );

      res.json({
        success: true,
        data: layouts
      });
    } catch (error) {
      console.error('Error fetching layouts:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar layouts do módulo'
      });
    }
  }

  async getLayoutById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { layoutId } = req.params;
      const tenantId = req.user!.tenantId;

      const layout = await this.repository.getLayoutById(tenantId, layoutId);

      if (!layout) {
        res.status(404).json({
          success: false,
          message: 'Layout não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: layout
      });
    } catch (error) {
      console.error('Error fetching layout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar layout'
      });
    }
  }

  async createLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const layoutData = {
        ...req.body,
        createdBy: userId
      };

      const layout = await this.repository.createLayout(tenantId, layoutData);

      // Log history
      await this.repository.addHistoryEntry(tenantId, {
        layoutId: layout.id,
        changeType: 'layout_created',
        newConfig: layout.layoutConfig,
        changeDescription: `Layout "${layout.layoutName}" criado`,
        changedBy: userId
      });

      res.status(201).json({
        success: true,
        data: layout
      });
    } catch (error) {
      console.error('Error creating layout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar layout'
      });
    }
  }

  async updateLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { layoutId } = req.params;
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      // Get current layout for history
      const currentLayout = await this.repository.getLayoutById(tenantId, layoutId);
      if (!currentLayout) {
        res.status(404).json({
          success: false,
          message: 'Layout não encontrado'
        });
        return;
      }

      const updatedLayout = await this.repository.updateLayout(tenantId, layoutId, req.body);

      if (!updatedLayout) {
        res.status(404).json({
          success: false,
          message: 'Layout não encontrado ou não atualizado'
        });
        return;
      }

      // Log history
      await this.repository.addHistoryEntry(tenantId, {
        layoutId: layoutId,
        changeType: 'layout_updated',
        previousConfig: currentLayout.layoutConfig,
        newConfig: updatedLayout.layoutConfig,
        changeDescription: `Layout "${updatedLayout.layoutName}" atualizado`,
        changedBy: userId
      });

      res.json({
        success: true,
        data: updatedLayout
      });
    } catch (error) {
      console.error('Error updating layout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar layout'
      });
    }
  }

  async deleteLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { layoutId } = req.params;
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const success = await this.repository.deleteLayout(tenantId, layoutId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Layout não encontrado'
        });
        return;
      }

      // Log history
      await this.repository.addHistoryEntry(tenantId, {
        layoutId: layoutId,
        changeType: 'layout_deleted',
        changeDescription: 'Layout removido',
        changedBy: userId
      });

      res.json({
        success: true,
        message: 'Layout removido com sucesso'
      });
    } catch (error) {
      console.error('Error deleting layout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover layout'
      });
    }
  }

  async setDefaultLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { layoutId } = req.params;
      const { moduleType, pageType } = req.body;
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const success = await this.repository.setDefaultLayout(
        tenantId, 
        layoutId, 
        moduleType as ModuleType, 
        pageType as PageType
      );

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Layout não encontrado'
        });
        return;
      }

      // Log history
      await this.repository.addHistoryEntry(tenantId, {
        layoutId: layoutId,
        changeType: 'layout_set_default',
        changeDescription: `Layout definido como padrão para ${moduleType}/${pageType}`,
        changedBy: userId
      });

      res.json({
        success: true,
        message: 'Layout definido como padrão'
      });
    } catch (error) {
      console.error('Error setting default layout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao definir layout padrão'
      });
    }
  }

  // ===========================
  // AVAILABLE FIELDS ENDPOINTS
  // ===========================

  async getAvailableFields(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user!.tenantId;

      const fields = await this.repository.getAvailableFields(tenantId, moduleType as ModuleType);

      // Group fields by category
      const groupedFields = fields.reduce((acc, field) => {
        if (!acc[field.category]) {
          acc[field.category] = [];
        }
        acc[field.category].push(field);
        return acc;
      }, {} as Record<string, typeof fields>);

      res.json({
        success: true,
        data: {
          fields: fields,
          categories: groupedFields
        }
      });
    } catch (error) {
      console.error('Error fetching available fields:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar campos disponíveis'
      });
    }
  }

  async getFieldsByCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { moduleType, category } = req.params;
      const tenantId = req.user!.tenantId;

      const fields = await this.repository.getFieldsByCategory(
        tenantId, 
        moduleType as ModuleType, 
        category
      );

      res.json({
        success: true,
        data: fields
      });
    } catch (error) {
      console.error('Error fetching fields by category:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar campos da categoria'
      });
    }
  }

  async createField(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const field = await this.repository.createField(tenantId, req.body);

      res.status(201).json({
        success: true,
        data: field
      });
    } catch (error) {
      console.error('Error creating field:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar campo'
      });
    }
  }

  async updateField(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fieldId } = req.params;
      const tenantId = req.user!.tenantId;

      const field = await this.repository.updateField(tenantId, fieldId, req.body);

      if (!field) {
        res.status(404).json({
          success: false,
          message: 'Campo não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: field
      });
    } catch (error) {
      console.error('Error updating field:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar campo'
      });
    }
  }

  async deleteField(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fieldId } = req.params;
      const tenantId = req.user!.tenantId;

      const success = await this.repository.deleteField(tenantId, fieldId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Campo não encontrado ou não pode ser removido'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Campo removido com sucesso'
      });
    } catch (error) {
      console.error('Error deleting field:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover campo'
      });
    }
  }

  // ===========================
  // LAYOUT SECTIONS ENDPOINTS
  // ===========================

  async getLayoutSections(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user!.tenantId;

      const sections = await this.repository.getLayoutSections(tenantId, moduleType as ModuleType);

      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      console.error('Error fetching layout sections:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar seções de layout'
      });
    }
  }

  async createSection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const section = await this.repository.createSection(tenantId, req.body);

      res.status(201).json({
        success: true,
        data: section
      });
    } catch (error) {
      console.error('Error creating section:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar seção'
      });
    }
  }

  // ===========================
  // HISTORY ENDPOINTS
  // ===========================

  async getLayoutHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { layoutId } = req.params;
      const { limit = 50 } = req.query;
      const tenantId = req.user!.tenantId;

      const history = await this.repository.getLayoutHistory(
        tenantId, 
        layoutId, 
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error fetching layout history:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico do layout'
      });
    }
  }

  // ===========================
  // UTILITY ENDPOINTS
  // ===========================

  async initializeModule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user!.tenantId;

      // Initialize default fields for the module
      await this.repository.initializeDefaultFields(tenantId, moduleType as ModuleType);

      res.json({
        success: true,
        message: `Módulo ${moduleType} inicializado com campos padrão`
      });
    } catch (error) {
      console.error('Error initializing module:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao inicializar módulo'
      });
    }
  }

  async getModuleInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user!.tenantId;

      const [layouts, fields, sections] = await Promise.all([
        this.repository.getLayoutsForModule(tenantId, moduleType as ModuleType),
        this.repository.getAvailableFields(tenantId, moduleType as ModuleType),
        this.repository.getLayoutSections(tenantId, moduleType as ModuleType)
      ]);

      const stats = {
        totalLayouts: layouts.length,
        defaultLayouts: layouts.filter(l => l.isDefault).length,
        totalFields: fields.length,
        systemFields: fields.filter(f => f.isSystemField).length,
        customFields: fields.filter(f => !f.isSystemField).length,
        totalSections: sections.length
      };

      res.json({
        success: true,
        data: {
          moduleType,
          stats,
          layouts,
          fields,
          sections
        }
      });
    } catch (error) {
      console.error('Error fetching module info:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar informações do módulo'
      });
    }
  }
}