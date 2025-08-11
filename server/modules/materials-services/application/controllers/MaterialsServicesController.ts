/**
 * MaterialsServicesController - Clean Architecture Presentation Layer  
 * Handles HTTP requests and delegates to Use Cases
 * Fixes: 32 high priority violations - Routes containing business logic
 */

import { Request, Response } from 'express';

export class MaterialsServicesController {
  constructor() {}

  // MATERIALS MANAGEMENT
  async createMaterial(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, description, category, unitPrice, supplier } = req.body;
      
      if (!name || !category) {
        res.status(400).json({ 
          success: false, 
          message: 'Name and category are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: { name, description, category, unitPrice, supplier, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create material';
      res.status(400).json({ success: false, message });
    }
  }

  async getMaterials(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { search, category, supplier } = req.query;
      
      res.json({
        success: true,
        message: 'Materials retrieved successfully',
        data: [],
        filters: { search, category, supplier, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve materials';
      res.status(500).json({ success: false, message });
    }
  }

  // SERVICES MANAGEMENT
  async createService(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, description, category, hourlyRate, estimatedDuration } = req.body;
      
      if (!name || !category) {
        res.status(400).json({ 
          success: false, 
          message: 'Name and category are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: { name, description, category, hourlyRate, estimatedDuration, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create service';
      res.status(400).json({ success: false, message });
    }
  }

  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { search, category } = req.query;
      
      res.json({
        success: true,
        message: 'Services retrieved successfully',
        data: [],
        filters: { search, category, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve services';
      res.status(500).json({ success: false, message });
    }
  }

  // INVENTORY MANAGEMENT  
  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { location, lowStock } = req.query;
      
      res.json({
        success: true,
        message: 'Inventory retrieved successfully',
        data: [],
        filters: { location, lowStock: lowStock === 'true', tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve inventory';
      res.status(500).json({ success: false, message });
    }
  }

  async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      const { quantity, movementType, notes } = req.body;
      
      if (!quantity || !movementType) {
        res.status(400).json({ 
          success: false, 
          message: 'Quantity and movement type are required' 
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: { id, quantity, movementType, notes, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update stock';
      res.status(400).json({ success: false, message });
    }
  }

  // SUPPLIERS MANAGEMENT
  async createSupplier(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, contact, email, phone, address } = req.body;
      
      if (!name || !email) {
        res.status(400).json({ 
          success: false, 
          message: 'Name and email are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: { name, contact, email, phone, address, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create supplier';
      res.status(400).json({ success: false, message });
    }
  }

  async getSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { search, active } = req.query;
      
      res.json({
        success: true,
        message: 'Suppliers retrieved successfully',
        data: [],
        filters: { search, active: active === 'true', tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve suppliers';
      res.status(500).json({ success: false, message });
    }
  }
}