
// ✅ 1QA.MD COMPLIANCE: CUSTOM FIELDS CONTROLLER
// Application layer - Controller following Clean Architecture

export class CustomFieldController {
  constructor(
    private customFieldRepository: any,
    private logger: any
  ) {}

  async getFieldsByModule(req: any, res: any): Promise<void> {
    try {
      this.logger.logInfo('[CONTROLLER] getFieldsByModule called', {
        moduleType: req.params.moduleType,
        user: req.user,
        timestamp: new Date().toISOString()
      });

      // ✅ 1QA.MD: Validate required parameters
      const { moduleType } = req.params;
      const { tenantId } = req.user;

      if (!moduleType) {
        this.logger.logError('[CONTROLLER] Missing moduleType parameter');
        return res.status(400).json({
          success: false,
          error: 'Module type is required'
        });
      }

      if (!tenantId) {
        this.logger.logError('[CONTROLLER] Missing tenantId in request');
        return res.status(401).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      this.logger.logInfo('[CONTROLLER] Fetching fields from repository', {
        moduleType,
        tenantId
      });

      // ✅ 1QA.MD: Call repository with proper parameters
      const fields = await this.customFieldRepository.findByModule(moduleType, tenantId);

      this.logger.logInfo('[CONTROLLER] Repository returned fields', {
        fieldsCount: fields?.length || 0,
        fields: fields
      });

      // ✅ 1QA.MD: Return standardized response
      res.status(200).json({
        success: true,
        data: fields || [],
        message: `Found ${fields?.length || 0} custom fields for module ${moduleType}`
      });

    } catch (error) {
      this.logger.logError('[CONTROLLER] Error in getFieldsByModule:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error while fetching custom fields',
          details: error.message
        });
      }
    }
  }

  async createField(req: any, res: any): Promise<void> {
    try {
      this.logger.logInfo('[CONTROLLER] createField called', {
        body: req.body,
        user: req.user,
        timestamp: new Date().toISOString()
      });

      const { tenantId, userId } = req.user;
      
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      // ✅ 1QA.MD: Add tenant and user info to field data
      const fieldData = {
        ...req.body,
        tenantId,
        createdBy: userId,
        updatedBy: userId
      };

      this.logger.logInfo('[CONTROLLER] Creating field with data:', fieldData);

      const result = await this.customFieldRepository.create(fieldData);

      this.logger.logInfo('[CONTROLLER] Field created successfully:', result);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Custom field created successfully'
      });

    } catch (error) {
      this.logger.logError('[CONTROLLER] Error in createField:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error while creating custom field',
          details: error.message
        });
      }
    }
  }

  async updateField(req: any, res: any): Promise<void> {
    try {
      const { fieldId } = req.params;
      const { tenantId, userId } = req.user;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const updateData = {
        ...req.body,
        updatedBy: userId
      };

      const result = await this.customFieldRepository.update(fieldId, tenantId, updateData);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Custom field not found'
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        message: 'Custom field updated successfully'
      });

    } catch (error) {
      this.logger.logError('[CONTROLLER] Error in updateField:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error while updating custom field'
        });
      }
    }
  }

  async deleteField(req: any, res: any): Promise<void> {
    try {
      const { fieldId } = req.params;
      const { tenantId } = req.user;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      await this.customFieldRepository.delete(fieldId, tenantId);

      res.status(200).json({
        success: true,
        message: 'Custom field deleted successfully'
      });

    } catch (error) {
      this.logger.logError('[CONTROLLER] Error in deleteField:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error while deleting custom field'
        });
      }
    }
  }
}
