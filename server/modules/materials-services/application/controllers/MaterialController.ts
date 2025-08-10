
import { Request, Response } from 'express';
import { standardResponse } from '../../../../utils/standardResponse';
import { CreateMaterialUseCase } from '../use-cases/CreateMaterialUseCase';

export class MaterialController {
  constructor(private createMaterialUseCase: CreateMaterialUseCase) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      const material = await this.createMaterialUseCase.execute(req.body, tenantId);
      res.status(201).json(standardResponse(true, 'Material criado com sucesso', material));
    } catch (error) {
      console.error('Erro ao criar material:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // Implementar lógica para listar materiais
      res.status(200).json(standardResponse(true, 'Lista de materiais obtida com sucesso', []));
    } catch (error) {
      console.error('Erro ao obter materiais:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }
}
