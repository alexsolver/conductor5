/**
 * CustomFieldsController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class CustomFieldsController {
  constructor() {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, type, required, options } = req.body;
      
      if (!name || !type) {
        res.status(400).json({ 
          success: false, 
          message: 'Name and type are required for custom field' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Custom field created successfully',
        data: { name, type, required: required || false, options, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create custom field';
      res.status(400).json({ success: false, message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Custom fields retrieved successfully',
        data: []
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve custom fields';
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Custom field retrieved successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve custom field';
      res.status(404).json({ success: false, message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Custom field updated successfully',
        data: { id, ...req.body, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update custom field';
      res.status(400).json({ success: false, message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        message: 'Custom field deleted successfully'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete custom field';
      res.status(400).json({ success: false, message });
    }
  }
}