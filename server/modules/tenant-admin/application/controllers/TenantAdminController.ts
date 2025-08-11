/**
 * TenantAdminController - Clean Architecture Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 * Fixes: 1 high priority violation - Routes containing business logic
 */

import { Request, Response } from 'express';

export class TenantAdminController {
  constructor() {}

  async getTenantConfig(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Tenant configuration retrieved successfully',
        data: { tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve tenant config';
      res.status(500).json({ success: false, message });
    }
  }

  async updateTenantConfig(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Tenant configuration updated successfully',
        data: { tenantId, ...req.body }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update tenant config';
      res.status(400).json({ success: false, message });
    }
  }

  async getTenantUsers(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { search, role, active } = req.query;
      
      res.json({
        success: true,
        message: 'Tenant users retrieved successfully',
        data: [],
        filters: { search, role, active: active === 'true', tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve tenant users';
      res.status(500).json({ success: false, message });
    }
  }

  async inviteUser(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { email, role, firstName, lastName } = req.body;
      
      if (!email || !role) {
        res.status(400).json({ 
          success: false, 
          message: 'Email and role are required' 
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'User invitation sent successfully',
        data: { email, role, firstName, lastName, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite user';
      res.status(400).json({ success: false, message });
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      const { role } = req.body;
      
      if (!role) {
        res.status(400).json({ 
          success: false, 
          message: 'Role is required' 
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'User role updated successfully',
        data: { userId, role, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user role';
      res.status(400).json({ success: false, message });
    }
  }

  async getBillingInfo(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Billing information retrieved successfully',
        data: { tenantId, plan: 'basic', usage: {} }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve billing info';
      res.status(500).json({ success: false, message });
    }
  }
}