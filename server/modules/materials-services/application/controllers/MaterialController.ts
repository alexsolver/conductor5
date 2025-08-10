
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
import { MaterialApplicationService } from '../services/MaterialApplicationService';

export class MaterialController {
  constructor(private materialService: MaterialApplicationService) {}

  async createMaterial(req: any, res: any): Promise<void> {
    try {
      const material = await this.materialService.createMaterial(req.body);
      res.status(201).json({ success: true, data: material });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMaterials(req: any, res: any): Promise<void> {
    try {
      const materials = await this.materialService.getMaterials(req.query);
      res.json({ success: true, data: materials });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateMaterial(req: any, res: any): Promise<void> {
    try {
      const material = await this.materialService.updateMaterial(req.params.id, req.body);
      res.json({ success: true, data: material });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteMaterial(req: any, res: any): Promise<void> {
    try {
      await this.materialService.deleteMaterial(req.params.id);
      res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
