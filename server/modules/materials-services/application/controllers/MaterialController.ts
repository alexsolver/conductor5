import { Request, Response } from 'express';
import { GetMaterialsUseCase } from '../use-cases/GetMaterialsUseCase';
import { CreateMaterialUseCase } from '../use-cases/CreateMaterialUseCase';
import { UpdateMaterialUseCase } from '../use-cases/UpdateMaterialUseCase';
import { standardResponse } from '../../../utils/standardResponse';

export class MaterialController {
  constructor(
    private getMaterialsUseCase: GetMaterialsUseCase = new GetMaterialsUseCase(),
    private createMaterialUseCase: CreateMaterialUseCase = new CreateMaterialUseCase(),
    private updateMaterialUseCase: UpdateMaterialUseCase = new UpdateMaterialUseCase()
  ) {}

  async getAllMaterials(req: Request, res: Response): Promise<void> {
    try {
      const materials = await this.getMaterialsUseCase.execute();
      standardResponse(res, 200, 'Materials retrieved successfully', materials);
    } catch (error) {
      standardResponse(res, 500, 'Failed to retrieve materials', null, error.message);
    }
  }

  async createMaterial(req: Request, res: Response): Promise<void> {
    try {
      const material = await this.createMaterialUseCase.execute(req.body);
      standardResponse(res, 201, 'Material created successfully', material);
    } catch (error) {
      standardResponse(res, 400, 'Failed to create material', null, error.message);
    }
  }

  async getMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const material = await this.getMaterialsUseCase.executeById(id);
      standardResponse(res, 200, 'Material retrieved successfully', material);
    } catch (error) {
      standardResponse(res, 404, 'Material not found', null, error.message);
    }
  }

  async updateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const material = await this.updateMaterialUseCase.execute(id, req.body);
      standardResponse(res, 200, 'Material updated successfully', material);
    } catch (error) {
      standardResponse(res, 400, 'Failed to update material', null, error.message);
    }
  }

  async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.getMaterialsUseCase.executeDelete(id);
      standardResponse(res, 200, 'Material deleted successfully', null);
    } catch (error) {
      standardResponse(res, 400, 'Failed to delete material', null, error.message);
    }
  }
}