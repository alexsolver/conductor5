
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../../utils/standardResponse';

export class PersonController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }

      // Implementar lógica usando Use Case
      sendSuccess(res, [], 'Pessoas obtidas com sucesso', 200);
    } catch (error) {
      console.error('Erro ao obter pessoas:', error);
      sendError(res, error, 'Erro interno do servidor', 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return sendError(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }

      // Implementar lógica usando Use Case
      sendSuccess(res, {}, 'Pessoa encontrada', 200);
    } catch (error) {
      console.error('Erro ao obter pessoa:', error);
      sendError(res, error, 'Erro interno do servidor', 500);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }

      // Implementar lógica usando Use Case
      sendSuccess(res, {}, 'Pessoa criada com sucesso', 201);
    } catch (error) {
      console.error('Erro ao criar pessoa:', error);
      sendError(res, error, 'Erro interno do servidor', 500);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return sendError(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }

      // Implementar lógica usando Use Case
      sendSuccess(res, {}, 'Pessoa atualizada com sucesso', 200);
    } catch (error) {
      console.error('Erro ao atualizar pessoa:', error);
      sendError(res, error, 'Erro interno do servidor', 500);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return sendError(res, 'Tenant ID é obrigatório', 'Tenant ID é obrigatório', 400);
      }

      // Implementar lógica usando Use Case
      sendSuccess(res, null, 'Pessoa excluída com sucesso', 200);
    } catch (error) {
      console.error('Erro ao excluir pessoa:', error);
      sendError(res, error, 'Erro interno do servidor', 500);
    }
  }
}
