
import { PartsServicesRepositoryEtapa1 } from "../../infrastructure/repositories/PartsServicesRepositoryEtapa1";
import { AuthenticatedRequest } from "../../../middleware/jwtAuth";
import { Request, Response } from 'express';

export class PartsServicesControllerEtapa1 {
  private repository: PartsServicesRepositoryEtapa1;

  constructor() {
    this.repository = new PartsServicesRepositoryEtapa1();
  }

  // ===== LOCALIZAÇÕES DE ESTOQUE =====
  getStockLocations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      
      const locations = await this.repository.findStockLocations(tenantId);
      res.json(locations);
    } catch (error) {
      console.error('Error fetching stock locations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      // Validação de dados obrigatórios
      const { location_code, location_name, location_type } = req.body;
      if (!location_code || !location_name || !location_type) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Campos obrigatórios: location_code, location_name, location_type'
        });
      }

      const location = await this.repository.createStockLocation(tenantId, req.body);
      res.status(201).json({
        success: true,
        data: location,
        message: 'Localização criada com sucesso'
      });
    } catch (error: any) {
      console.error('Error creating stock location:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Código da localização já existe'
        });
      }

      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  };

  updateStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const location = await this.repository.updateStockLocation(id, tenantId, req.body);
      if (!location) {
        return res.status(404).json({ error: 'Localização não encontrada' });
      }

      res.json({
        success: true,
        data: location,
        message: 'Localização atualizada com sucesso'
      });
    } catch (error) {
      console.error('Error updating stock location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const deleted = await this.repository.deleteStockLocation(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: 'Localização não encontrada' });
      }

      res.json({ 
        success: true,
        message: 'Localização excluída com sucesso' 
      });
    } catch (error) {
      console.error('Error deleting stock location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== INVENTÁRIO MULTI-LOCALIZAÇÃO =====
  getInventoryByLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { locationId } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const inventory = await this.repository.findInventoryByLocation(
        tenantId, 
        locationId as string
      );
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createInventoryPosition = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      // Validação de dados obrigatórios
      const { part_id, location_id } = req.body;
      if (!part_id || !location_id) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Campos obrigatórios: part_id, location_id'
        });
      }

      const inventory = await this.repository.createInventoryPosition(tenantId, req.body);
      res.status(201).json({
        success: true,
        data: inventory,
        message: 'Posição de estoque criada com sucesso'
      });
    } catch (error: any) {
      console.error('Error creating inventory position:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Posição de estoque já existe para esta peça nesta localização'
        });
      }

      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  };

  updateInventoryQuantity = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { partId, locationId } = req.params;
      const { quantity, reason } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      if (quantity === undefined || !reason) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Campos obrigatórios: quantity, reason'
        });
      }

      const updated = await this.repository.updateInventoryQuantity(
        tenantId, 
        partId, 
        locationId, 
        Number(quantity), 
        reason
      );

      if (!updated) {
        return res.status(404).json({ error: 'Posição de estoque não encontrada' });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Quantidade atualizada com sucesso'
      });
    } catch (error) {
      console.error('Error updating inventory quantity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== DASHBOARD ETAPA 1 =====
  getDashboardStatsEtapa1 = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const stats = await this.repository.getDashboardStatsEtapa1(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== ALERTAS =====
  getLowStockAlerts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const alerts = await this.repository.getLowStockAlerts(tenantId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
