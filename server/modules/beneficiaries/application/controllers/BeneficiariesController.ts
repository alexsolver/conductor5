
/**
 * APPLICATION CONTROLLER - BENEFICIARIES
 * Clean Architecture: Application layer controller
 */

import { Request, Response } from 'express';
import { CreateBeneficiaryUseCase } from '../use-cases/CreateBeneficiaryUseCase';
import { UpdateBeneficiaryUseCase } from '../use-cases/UpdateBeneficiaryUseCase';
import { GetBeneficiariesUseCase } from '../use-cases/GetBeneficiariesUseCase';
import { DeleteBeneficiaryUseCase } from '../use-cases/DeleteBeneficiaryUseCase';
import { CreateBeneficiaryDTO, UpdateBeneficiaryDTO, GetBeneficiariesDTO } from '../dto/CreateBeneficiaryDTO';

export class BeneficiariesController {
  constructor(
    private readonly createBeneficiaryUseCase: CreateBeneficiaryUseCase,
    private readonly updateBeneficiaryUseCase: UpdateBeneficiaryUseCase,
    private readonly getBeneficiariesUseCase: GetBeneficiariesUseCase,
    private readonly deleteBeneficiaryUseCase: DeleteBeneficiaryUseCase
  ) {}

  async createBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID é obrigatório'
        });
        return;
      }

      const createDTO: CreateBeneficiaryDTO = {
        ...req.body,
        tenantId
      };

      const result = await this.createBeneficiaryUseCase.execute(createDTO);

      res.status(201).json({
        success: true,
        message: 'Favorecido criado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Error creating beneficiary:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({
        success: false,
        message
      });
    }
  }

  async updateBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID é obrigatório'
        });
        return;
      }

      const updateDTO: UpdateBeneficiaryDTO = req.body;

      const result = await this.updateBeneficiaryUseCase.execute(id, updateDTO, tenantId);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Favorecido não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Favorecido atualizado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Error updating beneficiary:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({
        success: false,
        message
      });
    }
  }

  async getBeneficiaries(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID é obrigatório'
        });
        return;
      }

      const getBeneficiariesDTO: GetBeneficiariesDTO = {
        tenantId,
        search: req.query.search as string,
        customerId: req.query.customerId as string,
        isActive: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10
      };

      const result = await this.getBeneficiariesUseCase.execute(getBeneficiariesDTO);

      res.json({
        success: true,
        message: 'Favorecidos recuperados com sucesso',
        data: result.beneficiaries,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting beneficiaries:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({
        success: false,
        message
      });
    }
  }

  async deleteBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID é obrigatório'
        });
        return;
      }

      const success = await this.deleteBeneficiaryUseCase.execute(id, tenantId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Favorecido não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Favorecido excluído com sucesso'
      });
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({
        success: false,
        message
      });
    }
  }
}
