import { Request, Response } from 'express';
import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';

export class CustomFieldController {
  constructor(
    private readonly customFieldRepository: ICustomFieldRepository,
    private readonly logger: { logInfo: Function; logError: Function }
  ) {}

  async createField(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user || {};
      if (!tenantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Tenant ID required' 
        });
        return;
      }

      const fieldData = {
        ...req.body,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const result = await this.customFieldRepository.create(fieldData);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.logError('Error creating custom field:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  async getFieldsByModule(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user || {};
      const { moduleType } = req.params;

      if (!tenantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Tenant ID required' 
        });
        return;
      }

      const fields = await this.customFieldRepository.findByModule(moduleType, tenantId);

      res.status(200).json({
        success: true,
        data: fields
      });
    } catch (error) {
      this.logger.logError('Error fetching custom fields:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  async updateField(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user || {};
      const { fieldId } = req.params;

      if (!tenantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Tenant ID required' 
        });
        return;
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const result = await this.customFieldRepository.update(fieldId, tenantId, updateData);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.logError('Error updating custom field:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  async deleteField(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user || {};
      const { fieldId } = req.params;

      if (!tenantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Tenant ID required' 
        });
        return;
      }

      await this.customFieldRepository.delete(fieldId, tenantId);

      res.status(200).json({
        success: true,
        message: 'Field deleted successfully'
      });
    } catch (error) {
      this.logger.logError('Error deleting custom field:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}