
// ETAPA 6: MÓDULOS ENTERPRISE AVANÇADOS - CONTROLLER
import { Request, Response } from 'express';
import { PartsServicesRepositoryEtapa6 } from '../../infrastructure/repositories/PartsServicesRepositoryEtapa6';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

export class PartsServicesControllerEtapa6 {
  private repository: PartsServicesRepositoryEtapa6;

  constructor() {
    this.repository = new PartsServicesRepositoryEtapa6();
  }

  // ===== CONTROLE DE ATIVOS ENTERPRISE =====
  
  getAssetsEnterprise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getAssetsEnterprise(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Ativos carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getAssetsEnterprise:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createAssetEnterprise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const assetData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const result = await this.repository.createAssetEnterprise(tenantId, assetData);
      
      res.status(result.success ? 201 : 400).json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Ativo criado com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in createAssetEnterprise:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getAssetMaintenanceHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { assetId } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getAssetMaintenanceHistory(tenantId, assetId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Histórico carregado com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getAssetMaintenanceHistory:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== LPU ENTERPRISE COM VERSIONAMENTO =====
  
  getPriceListsEnterprise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getPriceListsEnterprise(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Listas de preços carregadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getPriceListsEnterprise:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createPriceListEnterprise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const priceListData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const result = await this.repository.createPriceListEnterprise(tenantId, priceListData);
      
      res.status(result.success ? 201 : 400).json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Lista de preços criada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in createPriceListEnterprise:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getPriceListItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { priceListId } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getPriceListItems(tenantId, priceListId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Itens carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getPriceListItems:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== MOTOR DE PREÇOS AVANÇADO =====
  
  getPricingRulesEngine = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getPricingRulesEngine(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Regras de preços carregadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getPricingRulesEngine:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  createPriceSimulation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const simulationData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const result = await this.repository.createPriceSimulation(tenantId, simulationData);
      
      res.status(result.success ? 201 : 400).json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Simulação criada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in createPriceSimulation:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== COMPLIANCE E AUDITORIA =====
  
  getAuditTrailsEnterprise = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const filters = req.query;
      const result = await this.repository.getAuditTrailsEnterprise(tenantId, filters);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Trilhas de auditoria carregadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getAuditTrailsEnterprise:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getComplianceAlerts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getComplianceAlerts(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Alertas de compliance carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getComplianceAlerts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getCertifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getCertifications(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Certificações carregadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getCertifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== MOBILE E OFFLINE =====
  
  getMobileDevices = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const userId = req.query.userId as string;
      const result = await this.repository.getMobileDevices(tenantId, userId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Dispositivos móveis carregados com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getMobileDevices:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  getOfflineSyncQueue = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID and User ID required' 
        });
      }

      const result = await this.repository.getOfflineSyncQueue(tenantId, userId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Fila de sincronização carregada com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getOfflineSyncQueue:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };

  // ===== DASHBOARD STATS ETAPA 6 =====
  
  getDashboardStatsEtapa6 = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
      }

      const result = await this.repository.getDashboardStatsEtapa6(tenantId);
      
      res.json({
        success: result.success,
        data: result.data,
        message: result.success ? 'Estatísticas carregadas com sucesso' : result.error
      });
    } catch (error) {
      console.error('Error in getDashboardStatsEtapa6:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  };
}
