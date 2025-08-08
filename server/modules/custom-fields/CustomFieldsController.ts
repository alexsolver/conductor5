import { Request, Response } from 'express';
import { CustomFieldsRepository } from './CustomFieldsRepository';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

export class CustomFieldsController {
  private customFieldsRepository: CustomFieldsRepository;

  constructor(repository: CustomFieldsRepository) {
    this.customFieldsRepository = repository;
  }

  // Get all fields for a specific module
  async getFieldsByModule(req: AuthenticatedRequest, res: Response) {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user!.tenantId;

      console.log('🔍 [Custom Fields] Getting fields for module:', moduleType, 'tenant:', tenantId);

      if (!moduleType) {
        return res.status(400).json({
          success: false,
          message: 'Module type is required'
        });
      }

      const fields = await this.customFieldsRepository.getFieldsByModule(tenantId, moduleType);

      console.log('✅ [Custom Fields] Found', fields.length, 'fields for module:', moduleType);

      return res.json({
        success: true,
        message: 'Fields retrieved successfully',
        data: fields
      });
    } catch (error) {
      console.error('❌ [Custom Fields] Error fetching fields by module:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get specific field by ID
  async getFieldById(req: AuthenticatedRequest, res: Response) {
    try {
      const { fieldId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID not found' });
      }

      const field = await this.customFieldsRepository.getFieldById(tenantId, fieldId);
      if (!field) {
        return res.status(404).json({ error: 'Field not found' });
      }

      res.json({ success: true, data: field });
    } catch (error) {
      console.error('Error getting field by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create new field
  async createField(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const fieldData = {
        ...req.body,
        tenantId,
        createdBy: userId,
        updatedBy: userId
      };

      const field = await this.customFieldsRepository.createField(fieldData);
      res.status(201).json({ success: true, data: field });
    } catch (error) {
      console.error('Error creating field:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update field
  async updateField(req: AuthenticatedRequest, res: Response) {
    try {
      const { fieldId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const updateData = {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date()
      };

      const field = await this.customFieldsRepository.updateField(tenantId, fieldId, updateData);
      if (!field) {
        return res.status(404).json({ error: 'Field not found' });
      }

      res.json({ success: true, data: field });
    } catch (error) {
      console.error('Error updating field:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete field (soft delete)
  async deleteField(req: AuthenticatedRequest, res: Response) {
    try {
      const { fieldId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID not found' });
      }

      await this.customFieldsRepository.deleteField(tenantId, fieldId);
      res.json({ success: true, message: 'Field deleted successfully' });
    } catch (error) {
      console.error('Error deleting field:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Reorder fields for a module
  async reorderFields(req: AuthenticatedRequest, res: Response) {
    try {
      const { moduleType } = req.params;
      const { fieldOrders } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID not found' });
      }

      await this.customFieldsRepository.reorderFields(tenantId, moduleType, fieldOrders);
      res.json({ success: true, message: 'Fields reordered successfully' });
    } catch (error) {
      console.error('Error reordering fields:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get entity values
  async getEntityValues(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID not found' });
      }

      const values = await this.customFieldsRepository.getEntityValues(tenantId, entityType, entityId);
      res.json({ success: true, data: values });
    } catch (error) {
      console.error('Error getting entity values:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Save entity values
  async saveEntityValues(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const { values } = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      await this.customFieldsRepository.saveEntityValues(tenantId, entityType, entityId, values, userId);
      res.json({ success: true, message: 'Values saved successfully' });
    } catch (error) {
      console.error('Error saving entity values:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete entity values
  async deleteEntityValues(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID not found' });
      }

      await this.customFieldsRepository.deleteEntityValues(tenantId, entityType, entityId);
      res.json({ success: true, message: 'Entity values deleted successfully' });
    } catch (error) {
      console.error('Error deleting entity values:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get tenant module access
  async getTenantModuleAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID not found' });
      }

      const access = await this.customFieldsRepository.getTenantModuleAccess(tenantId);
      res.json({ success: true, data: access });
    } catch (error) {
      console.error('Error getting tenant module access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update module access
  async updateModuleAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const { moduleType } = req.params;
      const { hasAccess } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID not found' });
      }

      await this.customFieldsRepository.updateModuleAccess(tenantId, moduleType, hasAccess);
      res.json({ success: true, message: 'Module access updated successfully' });
    } catch (error) {
      console.error('Error updating module access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get field statistics
  async getModuleFieldStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { moduleType } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID not found' });
      }

      const stats = await this.customFieldsRepository.getModuleFieldStats(tenantId, moduleType);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error getting module field stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default CustomFieldsController;