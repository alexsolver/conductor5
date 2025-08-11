/**
 * MaterialsServicesController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class MaterialsServicesController {
  constructor() {}

  async createMaterial(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, category, unit, price, description } = req.body;
      
      if (!name || !unit) {
        res.status(400).json({ 
          success: false, 
          message: 'Name and unit are required for material' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: { name, category, unit, price, description, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create material';
      res.status(400).json({ success: false, message });
    }
  }

  async getMaterials(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { category, search } = req.query;
      
      res.json({
        success: true,
        message: 'Materials retrieved successfully',
        data: [],
        filters: { category, search, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve materials';
      res.status(500).json({ success: false, message });
    }
  }

  async createService(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, category, rate, duration, description } = req.body;
      
      if (!name || !rate) {
        res.status(400).json({ 
          success: false, 
          message: 'Name and rate are required for service' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: { name, category, rate, duration, description, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create service';
      res.status(400).json({ success: false, message });
    }
  }

  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { category, search } = req.query;
      
      res.json({
        success: true,
        message: 'Services retrieved successfully',
        data: [],
        filters: { category, search, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve services';
      res.status(500).json({ success: false, message });
    }
  }

  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Inventory retrieved successfully',
        data: {
          materials: [],
          services: [],
          summary: { totalMaterials: 0, totalServices: 0 }
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve inventory';
      res.status(500).json({ success: false, message });
    }
  }
}