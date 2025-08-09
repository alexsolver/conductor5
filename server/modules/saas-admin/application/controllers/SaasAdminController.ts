
import { Request, Response } from 'express';
import { CreateSaasConfigUseCase } from '../use-cases/CreateSaasConfigUseCase';
import { sendSuccess, sendError } from '../../../../utils/standardResponse';

export class SaasAdminController {
  constructor(
    private readonly createSaasConfigUseCase: CreateSaasConfigUseCase
  ) {}
  
  async createConfig(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }
      
      const result = await this.createSaasConfigUseCase.execute(req.body);
      return sendSuccess(res, result, 'Configuração criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar configuração SaaS:', error);
      return sendError(res, error, 'Erro interno do servidor', 500);
    }
  }
}
