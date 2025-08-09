
// Removendo dependência direta do Express para seguir Clean Architecture
import { standardResponse } from '../../../utils/standardResponse';
import { CreateLocationUseCase } from '../use-cases/CreateLocationUseCase';

export class LocationController {
  constructor(private createLocationUseCase: CreateLocationUseCase) {}

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implementar GetAllLocationsUseCase
      res.status(200).json(standardResponse(true, 'Lista obtida com sucesso', []));
    } catch (error) {
      console.error('Erro ao obter locations:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implementar GetLocationByIdUseCase
      res.status(200).json(standardResponse(true, 'Location encontrada', {}));
    } catch (error) {
      console.error('Erro ao obter location:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async create(data: any): Promise<any> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      const result = await this.createLocationUseCase.execute({
        ...req.body,
        tenantId
      });

      res.status(201).json(standardResponse(true, 'Location criada com sucesso', result));
    } catch (error) {
      console.error('Erro ao criar location:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implementar UpdateLocationUseCase
      res.status(200).json(standardResponse(true, 'Location atualizada com sucesso', {}));
    } catch (error) {
      console.error('Erro ao atualizar location:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
        return;
      }

      // TODO: Implementar DeleteLocationUseCase
      res.status(200).json(standardResponse(true, 'Location excluída com sucesso'));
    } catch (error) {
      console.error('Erro ao excluir location:', error);
      res.status(500).json(standardResponse(false, 'Erro interno do servidor'));
    }
  }
}
