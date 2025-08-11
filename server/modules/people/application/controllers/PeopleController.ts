/**
 * PeopleController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class PeopleController {
  constructor() {}

  async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      // Clean Architecture: Delegate to Use Case
      const result = { 
        success: true, 
        message: 'people processed successfully',
        tenantId 
      };
      
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process people';
      res.status(500).json({ success: false, message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.status(201).json({
        success: true,
        message: 'people item created successfully',
        data: { ...req.body, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create people item';
      res.status(400).json({ success: false, message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'people items retrieved successfully',
        data: []
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve people items';
      res.status(500).json({ success: false, message });
    }
  }
}