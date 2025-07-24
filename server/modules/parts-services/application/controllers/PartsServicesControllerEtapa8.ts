
import { Request, Response } from 'express';
import { PartsServicesRepositoryEtapa8 } from '../infrastructure/repositories/PartsServicesRepositoryEtapa8';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

export class PartsServicesControllerEtapa8 {
  private repository: PartsServicesRepositoryEtapa8;

  constructor() {
    this.repository = new PartsServicesRepositoryEtapa8();
  }

  // ===== KPI MANAGEMENT =====
  
  getKPIDefinitions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getKPIDefinitions(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'KPIs carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getKPIDefinitions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  calculateKPIValue = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { kpiDefinitionId } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.calculateKPIValue(tenantId, kpiDefinitionId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'KPI calculado com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in calculateKPIValue:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getKPIValues = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { kpiDefinitionId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getKPIValues(
        tenantId, 
        kpiDefinitionId,
        startDate as string,
        endDate as string
      );
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Valores de KPI carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getKPIValues:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== DASHBOARD MANAGEMENT =====
  
  createDashboard = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const result = await this.repository.createDashboard(tenantId, req.body, userId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Dashboard criado com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in createDashboard:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getDashboards = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getDashboards(tenantId, userId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Dashboards carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getDashboards:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== PERFORMANCE BENCHMARKS =====
  
  createBenchmark = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.createBenchmark(tenantId, req.body);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Benchmark criado com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in createBenchmark:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getBenchmarks = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { benchmarkType } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getBenchmarks(tenantId, benchmarkType as string);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Benchmarks carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getBenchmarks:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== ANALYTICS ALERTS =====
  
  createAnalyticsAlert = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.createAnalyticsAlert(tenantId, req.body);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Alerta criado com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in createAnalyticsAlert:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getAnalyticsAlerts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { status } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getAnalyticsAlerts(tenantId, status as string);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Alertas carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getAnalyticsAlerts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== RELATÓRIOS =====
  
  generateInventoryAnalyticsReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.generateInventoryAnalyticsReport(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Relatório gerado com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in generateInventoryAnalyticsReport:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== DASHBOARD STATS =====
  
  getDashboardStatsEtapa8 = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getDashboardStatsEtapa8(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Estatísticas carregadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getDashboardStatsEtapa8:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== ANOMALY DETECTION =====
  
  detectAnomalies = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { analysisDays } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.detectAnomalies(
        tenantId, 
        analysisDays ? parseInt(analysisDays as string) : 30
      );
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Anomalias detectadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in detectAnomalies:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };
}
