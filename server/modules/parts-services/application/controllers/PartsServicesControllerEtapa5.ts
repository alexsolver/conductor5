
import { Request, Response } from 'express';
import { PartsServicesRepositoryEtapa5 } from '../../infrastructure/repositories/PartsServicesRepositoryEtapa5';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
  };
}

export class PartsServicesControllerEtapa5 {
  private repository: PartsServicesRepositoryEtapa5;

  constructor(repository?: PartsServicesRepositoryEtapa5) {
    this.repository = repository || new PartsServicesRepositoryEtapa5();
  }

  // ===== MULTI-WAREHOUSES MANAGEMENT =====
  getMultiWarehouses = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.findMultiWarehouses(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        total: result.total,
        message: result.success ? 'Armazéns carregados com sucesso' : 'Erro ao carregar armazéns'
      });
    } catch (error) {
      console.error('Error in getMultiWarehouses:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createMultiWarehouse = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      // Validação de dados obrigatórios
      const { warehouse_code, warehouse_name, warehouse_type, total_capacity } = req.body;
      if (!warehouse_code || !warehouse_name || !warehouse_type || !total_capacity) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: warehouse_code, warehouse_name, warehouse_type, total_capacity'
        });
      }

      const warehouseData = {
        ...req.body,
        created_by: req.user?.id
      };

      const result = await this.repository.createMultiWarehouse(tenantId, warehouseData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in createMultiWarehouse:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== WAREHOUSE TRANSFERS =====
  getWarehouseTransfers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.findWarehouseTransfers(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        total: result.total,
        message: result.success ? 'Transferências carregadas com sucesso' : 'Erro ao carregar transferências'
      });
    } catch (error) {
      console.error('Error in getWarehouseTransfers:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createWarehouseTransfer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      // Validação de dados obrigatórios
      const { source_warehouse_id, destination_warehouse_id, transfer_type, requested_date } = req.body;
      if (!source_warehouse_id || !destination_warehouse_id || !transfer_type || !requested_date) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: source_warehouse_id, destination_warehouse_id, transfer_type, requested_date'
        });
      }

      if (source_warehouse_id === destination_warehouse_id) {
        return res.status(400).json({
          success: false,
          message: 'Armazém de origem e destino não podem ser iguais'
        });
      }

      const transferData = {
        ...req.body,
        created_by: req.user?.id
      };

      const result = await this.repository.createWarehouseTransfer(tenantId, transferData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in createWarehouseTransfer:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== GPS TRACKING =====
  getGpsTracking = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { transferId } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      if (!transferId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Transfer ID required' 
        });
      }

      const result = await this.repository.findGpsTracking(tenantId, transferId);
      
      res.json({
        success: result.success,
        data: result.data,
        total: result.total,
        message: result.success ? 'Rastreamento GPS carregado com sucesso' : 'Erro ao carregar rastreamento'
      });
    } catch (error) {
      console.error('Error in getGpsTracking:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createGpsTracking = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      // Validação de dados obrigatórios
      const { transfer_id, current_latitude, current_longitude } = req.body;
      if (!transfer_id || !current_latitude || !current_longitude) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: transfer_id, current_latitude, current_longitude'
        });
      }

      const result = await this.repository.createGpsTracking(tenantId, req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in createGpsTracking:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== WAREHOUSE ANALYTICS =====
  getWarehouseAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { warehouseId } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getWarehouseAnalytics(tenantId, warehouseId as string);
      
      res.json({
        success: result.success,
        data: result.data,
        total: result.total,
        message: result.success ? 'Analytics carregados com sucesso' : 'Erro ao carregar analytics'
      });
    } catch (error) {
      console.error('Error in getWarehouseAnalytics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== DEMAND FORECASTING =====
  getDemandForecasting = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { warehouseId } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getDemandForecasting(tenantId, warehouseId as string);
      
      res.json({
        success: result.success,
        data: result.data,
        total: result.total,
        message: result.success ? 'Previsões carregadas com sucesso' : 'Erro ao carregar previsões'
      });
    } catch (error) {
      console.error('Error in getDemandForecasting:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== RETURN WORKFLOWS =====
  getReturnWorkflows = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.findReturnWorkflows(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        total: result.total,
        message: result.success ? 'Devoluções carregadas com sucesso' : 'Erro ao carregar devoluções'
      });
    } catch (error) {
      console.error('Error in getReturnWorkflows:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createReturnWorkflow = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      // Validação de dados obrigatórios
      const { warehouse_id, return_type, initiated_date, return_reason } = req.body;
      if (!warehouse_id || !return_type || !initiated_date || !return_reason) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: warehouse_id, return_type, initiated_date, return_reason'
        });
      }

      const returnData = {
        ...req.body,
        created_by: req.user?.id
      };

      const result = await this.repository.createReturnWorkflow(tenantId, returnData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in createReturnWorkflow:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== TRACKING CODES =====
  getTrackingCodes = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { entityType, entityId } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.findTrackingCodes(tenantId, entityType as string, entityId as string);
      
      res.json({
        success: result.success,
        data: result.data,
        total: result.total,
        message: result.success ? 'Códigos de rastreamento carregados com sucesso' : 'Erro ao carregar códigos'
      });
    } catch (error) {
      console.error('Error in getTrackingCodes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== DASHBOARD STATS ETAPA 5 =====
  getDashboardStatsEtapa5 = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getDashboardStatsEtapa5(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Estatísticas carregadas com sucesso' : 'Erro ao carregar estatísticas'
      });
    } catch (error) {
      console.error('Error in getDashboardStatsEtapa5:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };
}
