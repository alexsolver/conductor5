
import { Request, Response } from 'express';
import { PartsServicesRepositoryEtapa3 } from '../infrastructure/repositories/PartsServicesRepositoryEtapa3';

export class PartsServicesControllerEtapa3 {
  constructor(private repository: PartsServicesRepositoryEtapa3) {}

  // ===== TRANSFERÊNCIAS AUTOMATIZADAS =====
  createAutomatedTransferRule = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const ruleData = req.body;
      
      // Validações básicas
      if (!ruleData.rule_name || !ruleData.source_location_id || !ruleData.destination_location_id || !ruleData.trigger_type) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios: rule_name, source_location_id, destination_location_id, trigger_type'
        });
      }

      const rule = await this.repository.createAutomatedTransferRule(tenantId, userId, ruleData);
      
      res.json({
        success: true,
        data: rule,
        message: 'Regra de transferência automática criada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao criar regra de transferência:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  getAutomatedTransferRules = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const rules = await this.repository.getAutomatedTransferRules(tenantId);
      
      res.json(rules);
      
    } catch (error) {
      console.error('Erro ao buscar regras de transferência:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  executeAutomatedTransfers = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const results = await this.repository.executeAutomatedTransfers(tenantId);
      
      res.json({
        success: true,
        data: results,
        message: `${results.length} transferências automáticas executadas`
      });
      
    } catch (error) {
      console.error('Erro ao executar transferências automáticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== PREVISÃO DE DEMANDA =====
  generateDemandForecast = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const { partId, locationId, forecastDate } = req.body;
      
      if (!partId || !locationId || !forecastDate) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios: partId, locationId, forecastDate'
        });
      }

      const forecast = await this.repository.generateDemandForecast(tenantId, partId, locationId, forecastDate);
      
      res.json({
        success: true,
        data: forecast,
        message: 'Previsão de demanda gerada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao gerar previsão de demanda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  getDemandForecasts = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const filters = {
        partId: req.query.partId as string,
        locationId: req.query.locationId as string,
        dateFrom: req.query.dateFrom as string
      };

      const forecasts = await this.repository.getDemandForecasts(tenantId, filters);
      
      res.json(forecasts);
      
    } catch (error) {
      console.error('Erro ao buscar previsões de demanda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== ALERTAS DE ESTOQUE =====
  getStockAlerts = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const filters = {
        status: req.query.status as string,
        alertType: req.query.alertType as string
      };

      const alerts = await this.repository.getStockAlerts(tenantId, filters);
      
      res.json(alerts);
      
    } catch (error) {
      console.error('Erro ao buscar alertas de estoque:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  acknowledgeAlert = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { alertId } = req.params;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const alert = await this.repository.acknowledgeAlert(tenantId, alertId, userId);
      
      res.json({
        success: true,
        data: alert,
        message: 'Alerta reconhecido com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== CAPACIDADES DE ARMAZÉM =====
  updateWarehouseCapacity = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const capacityData = req.body;
      
      if (!capacityData.location_id) {
        return res.status(400).json({
          success: false,
          message: 'location_id é obrigatório'
        });
      }

      const capacity = await this.repository.updateWarehouseCapacity(tenantId, capacityData);
      
      res.json({
        success: true,
        data: capacity,
        message: 'Capacidade do armazém atualizada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao atualizar capacidade do armazém:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  getWarehouseCapacities = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const capacities = await this.repository.getWarehouseCapacities(tenantId);
      
      res.json(capacities);
      
    } catch (error) {
      console.error('Erro ao buscar capacidades dos armazéns:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== RASTREAMENTO EM TRÂNSITO =====
  createTransitTracking = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const trackingData = req.body;
      
      if (!trackingData.movement_id || !trackingData.source_location_id || !trackingData.destination_location_id) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios: movement_id, source_location_id, destination_location_id'
        });
      }

      const tracking = await this.repository.createTransitTracking(tenantId, trackingData);
      
      res.json({
        success: true,
        data: tracking,
        message: 'Rastreamento criado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao criar rastreamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  getTransitTrackings = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const filters = {
        status: req.query.status as string
      };

      const trackings = await this.repository.getTransitTrackings(tenantId, filters);
      
      res.json(trackings);
      
    } catch (error) {
      console.error('Erro ao buscar rastreamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  updateTransitStatus = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { trackingId } = req.params;
      const { status, notes } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status é obrigatório'
        });
      }

      const tracking = await this.repository.updateTransitStatus(tenantId, trackingId, status, notes);
      
      res.json({
        success: true,
        data: tracking,
        message: 'Status do rastreamento atualizado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao atualizar status do rastreamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== ANÁLISE ABC =====
  generateAbcAnalysis = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const analysis = await this.repository.generateAbcAnalysis(tenantId);
      
      res.json({
        success: true,
        data: analysis,
        message: `Análise ABC gerada para ${analysis.length} itens`
      });
      
    } catch (error) {
      console.error('Erro ao gerar análise ABC:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  getAbcAnalysis = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const filters = {
        classification: req.query.classification as string,
        locationId: req.query.locationId as string
      };

      const analysis = await this.repository.getAbcAnalysis(tenantId, filters);
      
      res.json(analysis);
      
    } catch (error) {
      console.error('Erro ao buscar análise ABC:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== DASHBOARD ANALYTICS =====
  getAdvancedAnalytics = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const analytics = await this.repository.getAdvancedAnalytics(tenantId);
      
      res.json({
        success: true,
        data: analytics,
        message: 'Analytics avançados carregados com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao buscar analytics avançados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
}
