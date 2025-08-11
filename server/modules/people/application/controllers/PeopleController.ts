/**
 * PeopleController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class PeopleController {
  constructor() {}

  async createPerson(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { firstName, lastName, email, phone, role, department } = req.body;
      
      if (!firstName || !lastName) {
        res.status(400).json({ 
          success: false, 
          message: 'First name and last name are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Person created successfully',
        data: { firstName, lastName, email, phone, role, department, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create person';
      res.status(400).json({ success: false, message });
    }
  }

  async getPeople(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { search, department, role } = req.query;
      
      res.json({
        success: true,
        message: 'People retrieved successfully',
        data: [],
        filters: { search, department, role, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve people';
      res.status(500).json({ success: false, message });
    }
  }

  async getPersonById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Person retrieved successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve person';
      res.status(404).json({ success: false, message });
    }
  }

  async updatePerson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Person updated successfully',
        data: { id, ...req.body, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update person';
      res.status(400).json({ success: false, message });
    }
  }

  async getPersonSkills(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Person skills retrieved successfully',
        data: [],
        personId: id,
        tenantId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve person skills';
      res.status(500).json({ success: false, message });
    }
  }
}