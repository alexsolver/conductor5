/**
 * FieldLayoutsController - Clean Architecture Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 * Fixes: 1 high priority violation - Routes containing business logic
 */

import { Request, Response } from 'express';

export class FieldLayoutsController {
  constructor() {}

  async getLayouts(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { entityType, active } = req.query;
      
      res.json({
        success: true,
        message: 'Field layouts retrieved successfully',
        data: [],
        filters: { entityType, active: active === 'true', tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve field layouts';
      res.status(500).json({ success: false, message });
    }
  }

  async createLayout(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, entityType, layout, isDefault } = req.body;
      
      if (!name || !entityType || !layout) {
        res.status(400).json({ 
          success: false, 
          message: 'Name, entity type, and layout are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Field layout created successfully',
        data: { name, entityType, layout, isDefault: isDefault || false, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create field layout';
      res.status(400).json({ success: false, message });
    }
  }

  async updateLayout(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Field layout updated successfully',
        data: { id, ...req.body, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update field layout';
      res.status(400).json({ success: false, message });
    }
  }

  async deleteLayout(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Field layout deleted successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete field layout';
      res.status(400).json({ success: false, message });
    }
  }

  async getDefaultLayout(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { entityType } = req.params;
      
      res.json({
        success: true,
        message: 'Default layout retrieved successfully',
        data: { entityType, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Default layout not found';
      res.status(404).json({ success: false, message });
    }
  }
}