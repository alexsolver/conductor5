// ✅ 1QA.MD COMPLIANCE: Contract Controller - Clean Architecture Application Layer
// HTTP interface following exact patterns from existing modules

import { Request, Response } from 'express';

// Extend Express Request interface for user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        email: string;
        role: string;
      };
    }
  }
}
import { CreateContractUseCase } from '../use-cases/CreateContractUseCase';
import { UpdateContractUseCase } from '../use-cases/UpdateContractUseCase';
import { IContractRepository } from '../../domain/repositories/IContractRepository';
import { ContractDomainService } from '../../domain/services/ContractDomainService';
import { z } from 'zod';

// ✅ Validation Schemas
const createContractSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  contractType: z.enum(['service', 'supply', 'maintenance', 'rental', 'sla']),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).optional(),
  customerCompanyId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  technicalManagerId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  renewalDate: z.string().transform(val => new Date(val)).optional(),
  totalValue: z.number().positive().optional(),
  monthlyValue: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  paymentTerms: z.number().positive().optional(),
  description: z.string().optional(),
  termsConditions: z.string().optional(),
  autoRenewal: z.boolean().optional(),
  renewalPeriodMonths: z.number().positive().optional(),
  metadata: z.record(z.any()).optional()
});

const updateContractSchema = z.object({
  title: z.string().min(1).optional(),
  contractType: z.enum(['service', 'supply', 'maintenance', 'rental', 'sla']).optional(),
  status: z.enum(['draft', 'analysis', 'approved', 'active', 'finished', 'canceled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).optional(),
  customerCompanyId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  technicalManagerId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  startDate: z.string().transform(val => new Date(val)).optional(),
  endDate: z.string().transform(val => new Date(val)).optional(),
  renewalDate: z.string().transform(val => new Date(val)).optional(),
  totalValue: z.number().optional(),
  monthlyValue: z.number().optional(),
  currency: z.string().length(3).optional(),
  paymentTerms: z.number().optional(),
  description: z.string().optional(),
  termsConditions: z.string().optional(),
  autoRenewal: z.boolean().optional(),
  renewalPeriodMonths: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

export class ContractController {
  private createContractUseCase: CreateContractUseCase;
  private updateContractUseCase: UpdateContractUseCase;

  constructor(
    private contractRepository: IContractRepository,
    private contractDomainService: ContractDomainService
  ) {
    this.createContractUseCase = new CreateContractUseCase(contractRepository, contractDomainService);
    this.updateContractUseCase = new UpdateContractUseCase(contractRepository, contractDomainService);
  }

  // ✅ Create Contract
  async create(req: Request, res: Response): Promise<void> {
    try {
      console.log('📝 [ContractController] Create contract request received');

      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID is required' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'User ID is required' });
        return;
      }

      // Validate request body
      const validatedData = createContractSchema.parse(req.body);

      // Execute use case
      const result = await this.createContractUseCase.execute(
        validatedData,
        tenantId,
        userId
      );

      res.status(201).json({
        success: true,
        data: result.contract.toJSON(),
        warnings: result.validationWarnings
      });

    } catch (error: any) {
      console.error('❌ [ContractController] Create contract error:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // ✅ Update Contract
  async update(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 [ContractController] Update contract request received');

      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const contractId = req.params.id;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID is required' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'User ID is required' });
        return;
      }

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID is required' });
        return;
      }

      // Validate request body
      const validatedData = updateContractSchema.parse(req.body);

      // Execute use case
      const result = await this.updateContractUseCase.execute(
        { ...validatedData, id: contractId },
        tenantId,
        userId
      );

      res.json({
        success: true,
        data: result.contract.toJSON(),
        financialImpact: result.financialImpact,
        warnings: result.validationWarnings
      });

    } catch (error: any) {
      console.error('❌ [ContractController] Update contract error:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Contract not found'
        });
        return;
      }

      if (error.message.includes('Invalid status transition')) {
        res.status(400).json({
          error: 'Invalid status transition',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // ✅ Get Contract by ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ContractController] Get contract by ID request received');

      const tenantId = req.user?.tenantId;
      const contractId = req.params.id;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID is required' });
        return;
      }

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID is required' });
        return;
      }

      const contract = await this.contractRepository.findById(contractId, tenantId);

      if (!contract) {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      res.json({
        success: true,
        data: contract.toJSON()
      });

    } catch (error: any) {
      console.error('❌ [ContractController] Get contract error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // ✅ List Contracts
  async list(req: Request, res: Response): Promise<void> {
    try {
      console.log('📋 [ContractController] List contracts request received');

      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID is required' });
        return;
      }

      // Parse query parameters for filters
      const filters = {
        status: req.query.status as any,
        contractType: req.query.contractType as any,
        priority: req.query.priority as any,
        customerCompanyId: req.query.customerCompanyId as string,
        managerId: req.query.managerId as string,
        locationId: req.query.locationId as string,
        search: req.query.search as string,
        isActive: req.query.isActive === 'false' ? false : true
      };

      const contracts = await this.contractRepository.findAll(tenantId, filters);

      res.json({
        success: true,
        data: contracts.map(contract => contract.toJSON()),
        total: contracts.length
      });

    } catch (error: any) {
      console.error('❌ [ContractController] List contracts error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // ✅ Delete Contract (Soft Delete)
  async delete(req: Request, res: Response): Promise<void> {
    try {
      console.log('🗑️ [ContractController] Delete contract request received');

      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const contractId = req.params.id;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID is required' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'User ID is required' });
        return;
      }

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID is required' });
        return;
      }

      // Check if contract exists
      const contract = await this.contractRepository.findById(contractId, tenantId);
      if (!contract) {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      // Soft delete
      await this.contractRepository.delete(contractId, tenantId);

      // Create audit entry
      await this.contractRepository.createAuditEntry(
        tenantId,
        userId,
        'DELETE_CONTRACT',
        contractId,
        contract.toJSON(),
        { isActive: false }
      );

      res.json({
        success: true,
        message: 'Contract deleted successfully'
      });

    } catch (error: any) {
      console.error('❌ [ContractController] Delete contract error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // ✅ Get Contract Summary
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 [ContractController] Get contract summary request received');

      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID is required' });
        return;
      }

      const summary = await this.contractRepository.getSummary(tenantId);

      res.json({
        success: true,
        data: summary
      });

    } catch (error: any) {
      console.error('❌ [ContractController] Get summary error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // ✅ Get Expiring Contracts
  async getExpiring(req: Request, res: Response): Promise<void> {
    try {
      console.log('📅 [ContractController] Get expiring contracts request received');

      const tenantId = req.user?.tenantId;
      const daysThreshold = parseInt(req.query.days as string) || 30;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID is required' });
        return;
      }

      const expiringContracts = await this.contractRepository.findExpiring(tenantId, daysThreshold);

      res.json({
        success: true,
        data: expiringContracts.map(contract => contract.toJSON()),
        total: expiringContracts.length
      });

    } catch (error: any) {
      console.error('❌ [ContractController] Get expiring contracts error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}