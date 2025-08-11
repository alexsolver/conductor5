/**
 * Materials Services Controller
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';
import { CreateMaterialUseCase } from '../use-cases/CreateMaterialUseCase';
import { GetMaterialsUseCase } from '../use-cases/GetMaterialsUseCase';
import { CreateServiceUseCase } from '../use-cases/CreateServiceUseCase';
import { GetServicesUseCase } from '../use-cases/GetServicesUseCase';

export class MaterialsServicesController {
  constructor(
    private createMaterialUseCase: CreateMaterialUseCase,
    private getMaterialsUseCase: GetMaterialsUseCase,
    private createServiceUseCase: CreateServiceUseCase,
    private getServicesUseCase: GetServicesUseCase
  ) {}

  // Materials endpoints
  async createMaterial(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const result = await this.createMaterialUseCase.execute({
        ...req.body,
        tenantId
      });
      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create material';
      res.status(400).json({ success: false, message });
    }
  }

  async getMaterials(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const result = await this.getMaterialsUseCase.execute({ tenantId });
      res.json({
        success: true,
        message: 'Materials retrieved successfully',
        data: result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve materials';
      res.status(500).json({ success: false, message });
    }
  }

  // Services endpoints
  async createService(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const result = await this.createServiceUseCase.execute({
        ...req.body,
        tenantId
      });
      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create service';
      res.status(400).json({ success: false, message });
    }
  }

  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const result = await this.getServicesUseCase.execute({ tenantId });
      res.json({
        success: true,
        message: 'Services retrieved successfully',
        data: result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve services';
      res.status(500).json({ success: false, message });
    }
  }
}