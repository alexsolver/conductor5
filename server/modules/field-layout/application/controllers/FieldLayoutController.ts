
import { Request, Response } from 'express';
import { CreateFieldLayoutUseCase } from '../use-cases/CreateFieldLayoutUseCase';
import { GetFieldLayoutsUseCase } from '../use-cases/GetFieldLayoutsUseCase';
import { sendSuccess, sendError } from '../../../../utils/standardResponse';

export class FieldLayoutController {
  constructor(
    private createFieldLayoutUseCase: CreateFieldLayoutUseCase,
    private getFieldLayoutsUseCase: GetFieldLayoutsUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, name, layout } = req.body;
      
      const result = await this.createFieldLayoutUseCase.execute({
        tenantId,
        name,
        layout
      });

      sendSuccess(res, result, 'Field layout created successfully');
    } catch (error) {
      sendError(res, error, 'Failed to create field layout', 500);
    }
  }

  async getByTenant(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      
      const result = await this.getFieldLayoutsUseCase.execute({ tenantId });

      sendSuccess(res, result, 'Field layouts retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to get field layouts', 500);
    }
  }
}
