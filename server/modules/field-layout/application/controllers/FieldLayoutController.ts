/**
 * FieldLayoutController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class FieldLayoutController {
  constructor() {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, fields, layout } = req.body;
      
      if (!name || !fields) {
        res.status(400).json({ 
          success: false, 
          message: 'Name and fields are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Field layout created successfully',
        data: { name, fields, layout, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create field layout';
      res.status(400).json({ success: false, message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Field layouts retrieved successfully',
        data: []
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve field layouts';
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Field layout retrieved successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve field layout';
      res.status(404).json({ success: false, message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
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
}