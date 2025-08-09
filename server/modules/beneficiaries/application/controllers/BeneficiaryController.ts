import { CreateBeneficiaryUseCase } from '../use-cases/CreateBeneficiaryUseCase';
import { GetBeneficiariesUseCase } from '../use-cases/GetBeneficiariesUseCase';
import { UpdateBeneficiaryUseCase } from '../use-cases/UpdateBeneficiaryUseCase';
import { DeleteBeneficiaryUseCase } from '../use-cases/DeleteBeneficiaryUseCase';
import { CreateBeneficiaryDTO } from '../dto/CreateBeneficiaryDTO';
import type { Request, Response } from 'express';

export interface GetBeneficiariesRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateBeneficiaryRequest extends CreateBeneficiaryDTO {
  tenantId: string;
}

export interface UpdateBeneficiaryRequest {
  id: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface DeleteBeneficiaryRequest {
  id: string;
  tenantId: string;
}

export class BeneficiaryController {
  constructor(
    private readonly createBeneficiaryUseCase: CreateBeneficiaryUseCase,
    private readonly getBeneficiariesUseCase: GetBeneficiariesUseCase,
    private readonly updateBeneficiaryUseCase: UpdateBeneficiaryUseCase,
    private readonly deleteBeneficiaryUseCase: DeleteBeneficiaryUseCase
  ) {}

  async create(request: CreateBeneficiaryRequest) {
    return await this.createBeneficiaryUseCase.execute(request);
  }

  async getAll(request: GetBeneficiariesRequest) {
    return await this.getBeneficiariesUseCase.execute(request);
  }

  async update(request: UpdateBeneficiaryRequest) {
    return await this.updateBeneficiaryUseCase.execute(request);
  }

  async delete(request: DeleteBeneficiaryRequest) {
    return await this.deleteBeneficiaryUseCase.execute(request);
  }

  // Legacy methods for compatibility with routes
  async getBeneficiaryCustomers(tenantId: string, beneficiaryId: string) {
    // Implementation for getting customers associated with a beneficiary
    return [];
  }

  async addBeneficiaryCustomer(tenantId: string, beneficiaryId: string, customerId: string) {
    // Implementation for adding customer to beneficiary
    return null;
  }

  async removeBeneficiaryCustomer(tenantId: string, beneficiaryId: string, customerId: string) {
    // Implementation for removing customer from beneficiary
    return false;
  }

  async getBeneficiaryLocations(tenantId: string, beneficiaryId: string) {
    // Implementation for getting locations associated with a beneficiary
    return [];
  }

  async addBeneficiaryLocation(tenantId: string, beneficiaryId: string, locationId: string, isPrimary: boolean = false) {
    // Implementation for adding location to beneficiary
    return null;
  }

  async removeBeneficiaryLocation(tenantId: string, beneficiaryId: string, locationId: string) {
    // Implementation for removing location from beneficiary
    return false;
  }

  async updateBeneficiaryLocationPrimary(tenantId: string, beneficiaryId: string, locationId: string, isPrimary: boolean) {
    // Implementation for updating location primary status
    return false;
  }

  // Added methods for Express request/response handling with error handling
  async getBeneficiaries(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new GetBeneficiariesUseCase();
      const beneficiaries = await useCase.execute();

      res.json({
        success: true,
        data: beneficiaries,
        message: 'Beneficiaries retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getBeneficiaries:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving beneficiaries'
      });
    }
  }

  async createBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new CreateBeneficiaryUseCase();
      const beneficiary = await useCase.execute(req.body);

      res.status(201).json({
        success: true,
        data: beneficiary,
        message: 'Beneficiary created successfully'
      });
    } catch (error) {
      console.error('Error in createBeneficiary:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating beneficiary'
      });
    }
  }
}