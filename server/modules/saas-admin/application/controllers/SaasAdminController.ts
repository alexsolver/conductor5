
import { Request, Response } from 'express';
import { CreateSaasConfigUseCase } from '../use-cases/CreateSaasConfigUseCase';
import { standardResponse } from '../../../utils/standardResponse';

export class SaasAdminController {
  constructor(
    private readonly createSaasConfigUseCase: CreateSaasConfigUseCase
  ) {}
  
  async createConfig(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }
      
      const result = await this.createSaasConfigUseCase.execute(req.body);
      res.status(201).json(standardResponse(true, 'Configuração criada com sucesso', result));
    } catch (error) {
      console.error('Erro ao criar configuração SaaS:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }
}
