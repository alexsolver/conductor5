/**
 * ContractController - Controlador de contratos
 * Seguindo Clean Architecture e 1qa.md compliance
 */

import { Request, Response } from 'express';
import { ContractApplicationService } from '../services/ContractApplicationService';
import { ZodError } from 'zod';

// Interface de usuário autenticado
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    email: string;
  };
}

export class ContractController {
  constructor(
    private contractApplicationService: ContractApplicationService
  ) {}

  async getContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🔍 [ContractController] Getting contracts...');
    
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID not found' });
        return;
      }

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        contractType,
        priority,
        managerId,
        customerCompanyId,
        search,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        totalValueMin,
        totalValueMax
      } = req.query;

      const filters = {
        status: status as string,
        contractType: contractType as string,
        priority: priority as string,
        managerId: managerId as string,
        customerCompanyId: customerCompanyId as string,
        search: search as string,
        startDateFrom: startDateFrom as string,
        startDateTo: startDateTo as string,
        endDateFrom: endDateFrom as string,
        endDateTo: endDateTo as string,
        totalValueMin: totalValueMin ? parseFloat(totalValueMin as string) : undefined,
        totalValueMax: totalValueMax ? parseFloat(totalValueMax as string) : undefined
      };

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.contractApplicationService.getContracts(tenantId, filters, options);

      res.json({
        success: true,
        data: result
      });

      console.log(`✅ [ContractController] Returned ${result.contracts.length} contracts`);
    } catch (error) {
      console.error('❌ [ContractController] Error getting contracts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get contracts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getContractById(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🔍 [ContractController] Getting contract by ID...');
    
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID not found' });
        return;
      }

      const { id } = req.params;
      const contract = await this.contractApplicationService.getContractById(tenantId, id);

      if (!contract) {
        res.status(404).json({
          success: false,
          message: 'Contract not found'
        });
        return;
      }

      res.json({
        success: true,
        data: contract
      });

      console.log('✅ [ContractController] Contract found:', contract.title);
    } catch (error) {
      console.error('❌ [ContractController] Error getting contract:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get contract',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('➕ [ContractController] Creating contract...');
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      
      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // Validar dados de entrada - usar validação manual por enquanto
      const contractData = {
        ...req.body,
        tenantId,
        createdById: userId,
        updatedById: userId
      };

      const contract = await this.contractApplicationService.createContract(tenantId, contractData);

      res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: contract
      });

      console.log('✅ [ContractController] Contract created:', contract.id);
    } catch (error) {
      console.error('❌ [ContractController] Error creating contract:', error);
      
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create contract',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('✏️ [ContractController] Updating contract...');
    
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      
      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const contract = await this.contractApplicationService.updateContract(tenantId, id, updateData, userId);

      res.json({
        success: true,
        message: 'Contract updated successfully',
        data: contract
      });

      console.log('✅ [ContractController] Contract updated:', contract.id);
    } catch (error) {
      console.error('❌ [ContractController] Error updating contract:', error);
      
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update contract',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🗑️ [ContractController] Deleting contract...');
    
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID not found' });
        return;
      }

      const { id } = req.params;
      await this.contractApplicationService.deleteContract(tenantId, id);

      res.json({
        success: true,
        message: 'Contract deleted successfully'
      });

      console.log('✅ [ContractController] Contract deleted:', id);
    } catch (error) {
      console.error('❌ [ContractController] Error deleting contract:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete contract',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDashboardMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('📈 [ContractController] Getting dashboard metrics...');
    
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID not found' });
        return;
      }

      const metrics = await this.contractApplicationService.getDashboardMetrics(tenantId);

      res.json({
        success: true,
        data: metrics
      });

      console.log('✅ [ContractController] Dashboard metrics returned');
    } catch (error) {
      console.error('❌ [ContractController] Error getting dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getFinancialSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('📊 [ContractController] Getting financial summary...');
    
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Tenant ID not found' });
        return;
      }

      const filters = req.query;
      const summary = await this.contractApplicationService.getFinancialSummary(tenantId, filters);

      res.json({
        success: true,
        data: summary
      });

      console.log('✅ [ContractController] Financial summary returned');
    } catch (error) {
      console.error('❌ [ContractController] Error getting financial summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get financial summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}