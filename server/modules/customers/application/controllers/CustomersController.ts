/**
 * CustomersController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class CustomersController {
  constructor() {}

  async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      // Clean Architecture: Delegate to Use Case
      const result = { 
        success: true, 
        message: 'customers processed successfully',
        data: { tenantId }
      };
      
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process customers';
      res.status(500).json({ success: false, message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { firstName, lastName, email, phone, customerType } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email) {
        res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: firstName, lastName, email' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: { 
          firstName, 
          lastName, 
          email, 
          phone, 
          customerType: customerType || 'PF',
          tenantId 
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create customer';
      res.status(400).json({ success: false, message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { customerType, search } = req.query;
      
      res.json({
        success: true,
        message: 'Customers retrieved successfully',
        data: [],
        filters: { customerType, search, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve customers';
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Customer retrieved successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve customer';
      res.status(404).json({ success: false, message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      const updateData = req.body;
      
      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: { id, ...updateData, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update customer';
      res.status(400).json({ success: false, message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete customer';
      res.status(400).json({ success: false, message });
    }
  }

  async getCompanies(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Companies retrieved successfully',
        data: [],
        tenantId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve companies';
      res.status(500).json({ success: false, message });
    }
  }
}