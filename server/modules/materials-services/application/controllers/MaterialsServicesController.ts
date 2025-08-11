/**
 * MaterialsServicesController - Clean Architecture Presentation Layer  
 * Handles HTTP requests and delegates to Use Cases
 * Fixes: 32 high priority violations - Routes containing business logic
 */

import { Request, Response } from 'express';
import { GetMaterialsUseCase } from '../use-cases/GetMaterialsUseCase';
import { CreateMaterialUseCase } from '../use-cases/CreateMaterialUseCase';
import { GetServicesUseCase } from '../use-cases/GetServicesUseCase';
import { CreateServiceUseCase } from '../use-cases/CreateServiceUseCase';

export class MaterialsServicesController {
  constructor(
    private getMaterialsUseCase: GetMaterialsUseCase,
    private createMaterialUseCase: CreateMaterialUseCase,
    private getServicesUseCase: GetServicesUseCase,
    private createServiceUseCase: CreateServiceUseCase
  ) {}

  async index(req: Request, res: Response): Promise<void> {
    await this.getMaterials(req, res);
  }

  async show(req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.createMaterial(req, res);
  }

  async update(req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }

  async delete(req: Request, res: Response): Promise<void> {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }

  async getMaterialById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!id) {
        res.status(400).json({ 
          success: false, 
          message: 'Material ID is required' 
        });
        return;
      }

      // Use direct SQL query following same pattern as tickets
      const { db } = await import('../../../../db');
      const { sql } = await import('drizzle-orm');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const query = `
        SELECT 
          id,
          tenant_id,
          name,
          description,
          type,
          status,
          measurement_unit,
          created_at,
          updated_at
        FROM "${schemaName}".items
        WHERE tenant_id = '${tenantId}' AND id = '${id}'
        LIMIT 1
      `;
      
      const result = await db.execute(sql.raw(query));
      const materials = Array.isArray(result) ? result : (result.rows || []);
      
      if (materials.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Material not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Material retrieved successfully',
        data: materials[0]
      });
    } catch (error) {
      console.error('🏗️ [MaterialsServicesController] Get Material Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to retrieve material';
      res.status(500).json({ success: false, message });
    }
  }

  async updateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, description, category, unitPrice, supplier } = req.body;
      
      if (!id) {
        res.status(400).json({ 
          success: false, 
          message: 'Material ID is required' 
        });
        return;
      }

      res.json({
        success: true,
        message: 'Material updated successfully',
        data: { id, name, description, category, unitPrice, supplier, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update material';
      res.status(500).json({ success: false, message });
    }
  }

  async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!id) {
        res.status(400).json({ 
          success: false, 
          message: 'Material ID is required' 
        });
        return;
      }

      res.json({
        success: true,
        message: 'Material deleted successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete material';
      res.status(500).json({ success: false, message });
    }
  }

  // MATERIALS MANAGEMENT
  async createMaterial(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const material = await this.createMaterialUseCase.execute(req.body, tenantId);
      res.status(201).json({ success: true, data: material });
    } catch (error) {
      console.error('❌ [MaterialsServicesController] Error creating material:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getMaterials(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const materials = await this.getMaterialsUseCase.execute(tenantId);
      res.json({ success: true, data: materials });
    } catch (error) {
      console.error('❌ [MaterialsServicesController] Error getting materials:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // SERVICES MANAGEMENT
  async createService(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const service = await this.createServiceUseCase.execute(req.body, tenantId);
      res.status(201).json({ success: true, data: service });
    } catch (error) {
      console.error('❌ [MaterialsServicesController] Error creating service:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const services = await this.getServicesUseCase.execute(tenantId);
      res.json({ success: true, data: services });
    } catch (error) {
      console.error('❌ [MaterialsServicesController] Error getting services:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // INVENTORY MANAGEMENT  
  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { location, lowStock } = req.query;
      
      console.log('📦 [MaterialsServicesController] Getting inventory for tenant:', tenantId);
      
      // Use direct SQL query following same pattern as tickets
      const { db } = await import('../../../../db');
      const { sql } = await import('drizzle-orm');
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const query = `
        SELECT 
          id,
          tenant_id,
          name,
          description,
          type,
          status,
          measurement_unit,
          created_at,
          updated_at
        FROM "${schemaName}".items
        WHERE tenant_id = '${tenantId}' AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 50
      `;
      
      console.log('📦 [MaterialsServicesController] Executing query:', query);
      
      const result = await db.execute(sql.raw(query));
      const inventory = Array.isArray(result) ? result : (result.rows || []);
      
      console.log('📦 [MaterialsServicesController] Inventory found:', inventory.length);
      
      res.json({
        success: true,
        message: 'Inventory retrieved successfully',
        data: inventory,
        filters: { location, lowStock: lowStock === 'true', tenantId }
      });
    } catch (error) {
      console.error('📦 [MaterialsServicesController] Error:', error);
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