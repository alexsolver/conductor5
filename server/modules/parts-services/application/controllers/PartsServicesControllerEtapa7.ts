
// ETAPA 7: SISTEMA DE MOVIMENTAÇÕES REAIS E ANALYTICS - CONTROLLER
import { Request, Response } from 'express';
import { PartsServicesRepositoryEtapa7 } from '../../infrastructure/repositories/PartsServicesRepositoryEtapa7';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

export class PartsServicesControllerEtapa7 {
  private repository: PartsServicesRepositoryEtapa7;

  constructor() {
    this.repository = new PartsServicesRepositoryEtapa7();
  }

  // ===== MOVIMENTAÇÕES REAIS =====
  
  getStockMovementsReal = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getStockMovementsReal(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Movimentações carregadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getStockMovementsReal:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createStockMovementReal = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const movementData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const result = await this.repository.createStockMovementReal(tenantId, movementData);
      
      res.status(result.success ? 201 : 400).json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Movimentação criada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in createStockMovementReal:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  approveStockMovement = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { movementId } = req.params;
      const approvedBy = req.user?.id;
      
      if (!tenantId || !approvedBy) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const result = await this.repository.approveStockMovement(tenantId, movementId, approvedBy);
      
      res.json({
        success: result.success,
        message: result.success ? 'Movimentação aprovada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in approveStockMovement:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  executeStockMovement = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { movementId } = req.params;
      const executedBy = req.user?.id;
      
      if (!tenantId || !executedBy) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const result = await this.repository.executeStockMovement(tenantId, movementId, executedBy);
      
      res.json({
        success: result.success,
        message: result.success ? 'Movimentação executada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in executeStockMovement:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== ANÁLISE ABC =====
  
  runABCAnalysis = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const { periodStart, periodEnd } = req.body;
      
      if (!periodStart || !periodEnd) {
        return res.status(400).json({
          success: false,
          message: 'Período de análise obrigatório'
        });
      }

      const result = await this.repository.runABCAnalysis(
        tenantId, 
        new Date(periodStart), 
        new Date(periodEnd)
      );
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Análise ABC executada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in runABCAnalysis:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getABCAnalysis = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getABCAnalysis(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Análise ABC carregada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getABCAnalysis:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== PREVISÃO DE DEMANDA =====
  
  generateDemandForecast = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const { partId, forecastPeriods } = req.body;
      
      if (!partId) {
        return res.status(400).json({
          success: false,
          message: 'ID da peça obrigatório'
        });
      }

      const result = await this.repository.generateDemandForecast(tenantId, partId, forecastPeriods);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Previsão de demanda gerada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in generateDemandForecast:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== ALERTAS DE ESTOQUE =====
  
  getStockAlerts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getStockAlerts(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Alertas carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getStockAlerts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createStockAlert = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.createStockAlert(tenantId, req.body);
      
      res.status(result.success ? 201 : 400).json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Alerta criado com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in createStockAlert:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== DASHBOARD STATS ETAPA 7 =====
  
  getDashboardStatsEtapa7 = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getDashboardStatsEtapa7(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Estatísticas carregadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getDashboardStatsEtapa7:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };
}
