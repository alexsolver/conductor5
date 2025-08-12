/**
 * Beneficiary Controller - Application Layer
 * 
 * Handles HTTP requests and responses for beneficiary operations.
 * Coordinates with use cases and provides proper error handling and response formatting.
 * 
 * @module BeneficiaryController
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

import { Request, Response } from 'express';
import { CreateBeneficiaryUseCase, CreateBeneficiaryInput } from '../use-cases/CreateBeneficiaryUseCase';
import { FindBeneficiaryUseCase, FindBeneficiariesInput } from '../use-cases/FindBeneficiaryUseCase';
import { UpdateBeneficiaryUseCase, UpdateBeneficiaryInput } from '../use-cases/UpdateBeneficiaryUseCase';
import { DeleteBeneficiaryUseCase, DeleteBeneficiariesInput } from '../use-cases/DeleteBeneficiaryUseCase';

// Extend Express Request to include user info
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class BeneficiaryController {
  constructor(
    private readonly createBeneficiaryUseCase: CreateBeneficiaryUseCase,
    private readonly findBeneficiaryUseCase: FindBeneficiaryUseCase,
    private readonly updateBeneficiaryUseCase: UpdateBeneficiaryUseCase,
    private readonly deleteBeneficiaryUseCase: DeleteBeneficiaryUseCase
  ) {}

  /**
   * Create a new beneficiary
   * POST /api/beneficiaries-integration/v2
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const input: CreateBeneficiaryInput = {
        tenantId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        cellPhone: req.body.cellPhone,
        cpf: req.body.cpf,
        cnpj: req.body.cnpj,
        rg: req.body.rg,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        contactPerson: req.body.contactPerson,
        contactPhone: req.body.contactPhone,
        integrationCode: req.body.integrationCode,
        customerId: req.body.customerId,
        customerCode: req.body.customerCode,
        birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
        notes: req.body.notes,
        isActive: req.body.isActive
      };

      const result = await this.createBeneficiaryUseCase.execute(input);

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors,
          message: result.message
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.beneficiary,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error creating beneficiary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create beneficiary'
      });
    }
  }

  /**
   * Get beneficiary by ID
   * GET /api/beneficiaries-integration/v2/:id
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;
      const result = await this.findBeneficiaryUseCase.findById({ id, tenantId });

      if (!result.success) {
        const statusCode = result.error === 'Beneficiary not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        data: result.beneficiary,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error finding beneficiary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiary'
      });
    }
  }

  /**
   * List beneficiaries with filtering and pagination
   * GET /api/beneficiaries-integration/v2
   */
  async findMany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      // Parse query parameters
      const input: FindBeneficiariesInput = {
        tenantId,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        customerCode: req.query.customerCode as string,
        customerId: req.query.customerId as string,
        city: req.query.city as string,
        state: req.query.state as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        hasEmail: req.query.hasEmail ? req.query.hasEmail === 'true' : undefined,
        hasPhone: req.query.hasPhone ? req.query.hasPhone === 'true' : undefined,
        hasCpf: req.query.hasCpf ? req.query.hasCpf === 'true' : undefined,
        hasCnpj: req.query.hasCnpj ? req.query.hasCnpj === 'true' : undefined,
        birthDateFrom: req.query.birthDateFrom ? new Date(req.query.birthDateFrom as string) : undefined,
        birthDateTo: req.query.birthDateTo ? new Date(req.query.birthDateTo as string) : undefined,
        createdFrom: req.query.createdFrom ? new Date(req.query.createdFrom as string) : undefined,
        createdTo: req.query.createdTo ? new Date(req.query.createdTo as string) : undefined,
        sortBy: req.query.sortBy as 'name' | 'email' | 'createdAt' | 'updatedAt' || 'name',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'asc'
      };

      const result = await this.findBeneficiaryUseCase.findMany(input);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        data: result.beneficiaries,
        pagination: result.pagination,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error listing beneficiaries:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiaries'
      });
    }
  }

  /**
   * Search beneficiaries
   * GET /api/beneficiaries-integration/v2/search
   */
  async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { q: searchTerm } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          error: 'Search term is required',
          message: 'Please provide a search term'
        });
        return;
      }

      const result = await this.findBeneficiaryUseCase.search(
        tenantId,
        searchTerm as string,
        limit,
        offset
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        data: result.beneficiaries,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error searching beneficiaries:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to search beneficiaries'
      });
    }
  }

  /**
   * Update beneficiary
   * PUT /api/beneficiaries-integration/v2/:id
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;
      const input: UpdateBeneficiaryInput = {
        id,
        tenantId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        cellPhone: req.body.cellPhone,
        cpf: req.body.cpf,
        cnpj: req.body.cnpj,
        rg: req.body.rg,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        contactPerson: req.body.contactPerson,
        contactPhone: req.body.contactPhone,
        integrationCode: req.body.integrationCode,
        customerId: req.body.customerId,
        customerCode: req.body.customerCode,
        birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
        notes: req.body.notes,
        isActive: req.body.isActive
      };

      const result = await this.updateBeneficiaryUseCase.execute(input);

      if (!result.success) {
        const statusCode = result.errors?.includes('Beneficiary not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          errors: result.errors,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        data: result.beneficiary,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error updating beneficiary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update beneficiary'
      });
    }
  }

  /**
   * Delete beneficiary
   * DELETE /api/beneficiaries-integration/v2/:id
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;
      const result = await this.deleteBeneficiaryUseCase.execute({ id, tenantId });

      if (!result.success) {
        const statusCode = result.errors?.includes('Beneficiary not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          errors: result.errors,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error deleting beneficiary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete beneficiary'
      });
    }
  }

  /**
   * Get beneficiary statistics
   * GET /api/beneficiaries-integration/v2/stats
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const result = await this.findBeneficiaryUseCase.getStats(tenantId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        data: result.stats,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error getting statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve statistics'
      });
    }
  }

  /**
   * Get recent beneficiaries
   * GET /api/beneficiaries-integration/v2/recent
   */
  async getRecent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.findBeneficiaryUseCase.getRecent(tenantId, days, limit);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        data: result.beneficiaries,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error getting recent beneficiaries:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve recent beneficiaries'
      });
    }
  }

  /**
   * Find beneficiary by CPF
   * GET /api/beneficiaries-integration/v2/cpf/:cpf
   */
  async findByCpf(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { cpf } = req.params;
      const result = await this.findBeneficiaryUseCase.findByCpf(cpf, tenantId);

      if (!result.success) {
        const statusCode = result.error === 'Beneficiary not found with this CPF' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        data: result.beneficiary,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error finding beneficiary by CPF:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiary'
      });
    }
  }

  /**
   * Find beneficiaries by customer ID
   * GET /api/beneficiaries-integration/v2/customer/:customerId
   */
  async findByCustomerId(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { customerId } = req.params;
      const result = await this.findBeneficiaryUseCase.findByCustomerId(customerId, tenantId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        data: result.beneficiaries,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error finding beneficiaries by customer ID:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve beneficiaries'
      });
    }
  }

  /**
   * Bulk delete beneficiaries
   * DELETE /api/beneficiaries-integration/v2/bulk
   */
  async bulkDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        res.status(400).json({
          success: false,
          error: 'Invalid input',
          message: 'IDs array is required'
        });
        return;
      }

      const input: DeleteBeneficiariesInput = { ids, tenantId };
      const result = await this.deleteBeneficiaryUseCase.executeBulk(input);

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('[BeneficiaryController] Error bulk deleting beneficiaries:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete beneficiaries'
      });
    }
  }
}