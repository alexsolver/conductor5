import { Request, Response } from 'express';
import { createSuccessResponse, createErrorResponse } from '../../../../utils/standardResponse';
import { BeneficiaryApplicationService } from '../../application/services/BeneficiaryApplicationService'; // Assumindo que este serviço existe
import { CreateBeneficiaryDTO } from '../../application/dtos/CreateBeneficiaryDTO'; // Assumindo que este DTO existe
import { BeneficiaryResponseDTO } from '../../application/dtos/BeneficiaryResponseDTO'; // Assumindo que este DTO existe

export class BeneficiaryController {
  constructor(private beneficiaryService: BeneficiaryApplicationService) {}

  async getBeneficiaries(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return createErrorResponse(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }
      const beneficiaries = await this.beneficiaryService.getAllBeneficiaries(tenantId);
      createSuccessResponse(res, beneficiaries, 'Beneficiários obtidos com sucesso');
    } catch (error: any) {
      console.error('Erro ao obter beneficiários:', error);
      createErrorResponse(res, error.message, 'Erro interno do servidor');
    }
  }

  async getBeneficiaryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return createErrorResponse(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }
      const beneficiary = await this.beneficiaryService.getBeneficiaryById(tenantId, id);
      createSuccessResponse(res, beneficiary, 'Beneficiário encontrado');
    } catch (error: any) {
      console.error('Erro ao obter beneficiário:', error);
      createErrorResponse(res, error.message, 'Erro interno do servidor');
    }
  }

  async createBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return createErrorResponse(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }
      const createBeneficiaryDTO: CreateBeneficiaryDTO = req.body; // Assumindo que o DTO pode ser inferido do body
      createBeneficiaryDTO.tenantId = tenantId; // Adicionando tenantId se não estiver no body

      const beneficiary = await this.beneficiaryService.createBeneficiary(createBeneficiaryDTO);
      createSuccessResponse(res, beneficiary, 'Beneficiário criado com sucesso', 201);
    } catch (error: any) {
      console.error('Erro ao criar beneficiário:', error);
      createErrorResponse(res, error.message, 'Erro interno do servidor');
    }
  }

  async updateBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return createErrorResponse(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }
      const updateBeneficiaryDTO = req.body; // Assumindo que o DTO pode ser inferido do body
      updateBeneficiaryDTO.tenantId = tenantId; // Adicionando tenantId se não estiver no body
      updateBeneficiaryDTO.id = id; // Adicionando id se não estiver no body

      const beneficiary = await this.beneficiaryService.updateBeneficiary(updateBeneficiaryDTO);
      createSuccessResponse(res, beneficiary, 'Beneficiário atualizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao atualizar beneficiário:', error);
      createErrorResponse(res, error.message, 'Erro interno do servidor');
    }
  }

  async deleteBeneficiary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return createErrorResponse(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }
      await this.beneficiaryService.deleteBeneficiary(tenantId, id);
      createSuccessResponse(res, null, 'Beneficiário excluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir beneficiário:', error);
      createErrorResponse(res, error.message, 'Erro interno do servidor');
    }
  }
}