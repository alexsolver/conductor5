// ✅ 1QA.MD COMPLIANCE: CUSTOM FIELDS CONTROLLER
// Application layer - Controllers following Clean Architecture

console.log('🔥 [CUSTOM-FIELDS-CONTROLLER] *** FILE LOADING START *** following 1qa.md');
console.log('🔥 [CUSTOM-FIELDS-CONTROLLER] Timestamp:', new Date().toISOString());

import { Request, Response } from 'express';
import { SimplifiedCustomFieldRepository } from '../../infrastructure/repositories/SimplifiedCustomFieldRepository';

export class CustomFieldController {
  private repository: SimplifiedCustomFieldRepository;
  private logger: any;

  constructor(repository: SimplifiedCustomFieldRepository, logger: any) {
    this.repository = repository;
    this.logger = logger;

    console.log('🔥 [CUSTOM-FIELDS-CONTROLLER] Controller initialized following Clean Architecture');
  }

  async getFieldsByModule(req: any, res: Response) {
    const startTime = Date.now();
    const { moduleType } = req.params;
    const tenantId = req.user?.tenantId;

    this.logger.logInfo('=== getFieldsByModule CONTROLLER METHOD CALLED ===', { 
      moduleType,
      tenantId,
      timestamp: new Date().toISOString()
    });

    try {
      // ✅ 1QA.MD: Validate moduleType parameter
      if (!moduleType) {
        return res.status(400).json({
          success: false,
          error: 'Module type is required',
          details: 'moduleType parameter is missing'
        });
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
          details: 'Request missing tenant context'
        });
      }

      this.logger.logInfo('Setting tenant ID and calling repository getFieldsByModule...');
      this.repository.setTenantId(tenantId);
      const fields = await this.repository.getFieldsByModule(moduleType);

      const duration = Date.now() - startTime;
      this.logger.logInfo(`Repository call completed in ${duration}ms`, { fieldsCount: fields?.length || 0 });

      // ✅ 1QA.MD: Always return consistent response structure
      res.status(200).json({
        success: true,
        data: fields || [],
        count: fields?.length || 0,
        message: `Custom fields retrieved successfully for ${moduleType}`
      });

      this.logger.logInfo(`getFieldsByModule completed successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(`getFieldsByModule error after ${duration}ms:`, error);

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve custom fields',
        details: (error as Error)?.message || 'Unknown error'
      });
    }
  }

  async createField(req: any, res: Response) {
    const startTime = Date.now();
    const tenantId = req.user?.tenantId;

    this.logger.logInfo('=== createField CONTROLLER METHOD CALLED ===', {
      body: req.body,
      tenantId,
      timestamp: new Date().toISOString()
    });

    try {
      // ✅ 1QA.MD: Validate required fields
      const { moduleType, fieldName, fieldType, fieldLabel } = req.body;

      if (!moduleType || !fieldName || !fieldType || !fieldLabel) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          details: 'moduleType, fieldName, fieldType, and fieldLabel are required'
        });
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
          details: 'Request missing tenant context'
        });
      }

      this.logger.logInfo('Setting tenant ID and calling repository createField...');
      this.repository.setTenantId(tenantId);
      const fieldData = req.body;
      const result = await this.repository.createField(fieldData);

      const duration = Date.now() - startTime;
      this.logger.logInfo(`Repository createField completed in ${duration}ms`);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Custom field created successfully'
      });

      this.logger.logInfo(`createField completed successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(`createField error after ${duration}ms:`, error);

      res.status(500).json({
        success: false,
        error: 'Failed to create custom field',
        details: (error as Error)?.message || 'Unknown error'
      });
    }
  }

  async updateField(req: Request, res: Response) {
    const startTime = Date.now();
    const { fieldId } = req.params;

    this.logger.logInfo('=== updateField CONTROLLER METHOD CALLED ===', {
      fieldId,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    try {
      // ✅ 1QA.MD: Validate fieldId parameter
      if (!fieldId) {
        return res.status(400).json({
          success: false,
          error: 'Field ID is required',
          details: 'fieldId parameter is missing'
        });
      }

      this.logger.logInfo('Calling repository updateField...');
      const fieldData = req.body;
      const result = await this.repository.updateField(fieldId, fieldData);

      const duration = Date.now() - startTime;
      this.logger.logInfo(`Repository updateField completed in ${duration}ms`);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Custom field updated successfully'
      });

      this.logger.logInfo(`updateField completed successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(`updateField error after ${duration}ms:`, error);

      res.status(500).json({
        success: false,
        error: 'Failed to update custom field',
        details: (error as Error)?.message || 'Unknown error'
      });
    }
  }

  async deleteField(req: Request, res: Response) {
    const startTime = Date.now();
    const { fieldId } = req.params;

    this.logger.logInfo('=== deleteField CONTROLLER METHOD CALLED ===', {
      fieldId,
      timestamp: new Date().toISOString()
    });

    try {
      // ✅ 1QA.MD: Validate fieldId parameter
      if (!fieldId) {
        return res.status(400).json({
          success: false,
          error: 'Field ID is required',
          details: 'fieldId parameter is missing'
        });
      }

      this.logger.logInfo('Calling repository deleteField...');
      await this.repository.deleteField(fieldId);

      const duration = Date.now() - startTime;
      this.logger.logInfo(`Repository deleteField completed in ${duration}ms`);

      res.status(200).json({
        success: true,
        message: 'Custom field deleted successfully'
      });

      this.logger.logInfo(`deleteField completed successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(`deleteField error after ${duration}ms:`, error);

      res.status(500).json({
        success: false,
        error: 'Failed to delete custom field',
        details: (error as Error)?.message || 'Unknown error'
      });
    }
  }
}

console.log('🔥 [CUSTOM-FIELDS-CONTROLLER] *** FILE LOADING END *** following 1qa.md');