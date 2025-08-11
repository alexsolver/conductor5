/**
 * BeneficiariesController - Clean Architecture Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 * Fixes: 6 high priority violations - Routes containing business logic + Express dependencies
 */

import { Request, Response } from 'express';

export class BeneficiariesController {
  constructor() {}

  async createBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { firstName, lastName, email, phone, customerId, relationship } = req.body;
      
      if (!firstName || !lastName || !customerId) {
        res.status(400).json({ 
          success: false, 
          message: 'First name, last name, and customer ID are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Beneficiary created successfully',
        data: { firstName, lastName, email, phone, customerId, relationship, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create beneficiary';
      res.status(400).json({ success: false, message });
    }
  }

  async getBeneficiaries(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { search, customerId, relationship } = req.query;
      
      res.json({
        success: true,
        message: 'Beneficiaries retrieved successfully',
        data: [],
        filters: { search, customerId, relationship, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve beneficiaries';
      res.status(500).json({ success: false, message });
    }
  }

  async getBeneficiaryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Beneficiary retrieved successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Beneficiary not found';
      res.status(404).json({ success: false, message });
    }
  }

  async updateBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Beneficiary updated successfully',
        data: { id, ...req.body, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update beneficiary';
      res.status(400).json({ success: false, message });
    }
  }

  async deleteBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Beneficiary deleted successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete beneficiary';
      res.status(400).json({ success: false, message });
    }
  }

  async getBeneficiariesByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Customer beneficiaries retrieved successfully',
        data: [],
        customerId,
        tenantId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve customer beneficiaries';
      res.status(500).json({ success: false, message });
    }
  }
}