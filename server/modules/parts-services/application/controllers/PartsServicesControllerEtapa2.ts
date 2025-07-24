
import { Request, Response } from 'express';
import { PartsServicesRepositoryEtapa2 } from '../infrastructure/repositories/PartsServicesRepositoryEtapa2';

export class PartsServicesControllerEtapa2 {
  constructor(private repository: PartsServicesRepositoryEtapa2) {}

  // ===== MOVIMENTAÇÕES DE ESTOQUE =====
  createMovement = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const movementData = req.body;
      
      // Validações básicas
      if (!movementData.part_id || !movementData.location_id || !movementData.movement_type || !movementData.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios: part_id, location_id, movement_type, quantity'
        });
      }

      const movement = await this.repository.createMovement(tenantId, userId, movementData);
      
      res.json({
        success: true,
        data: movement,
        message: 'Movimentação criada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  getMovements = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const filters = {
        partId: req.query.partId as string,
        locationId: req.query.locationId as string,
        movementType: req.query.movementType as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        status: req.query.status as string
      };

      const movements = await this.repository.findMovements(tenantId, filters);
      res.json(movements);
      
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  approveMovement = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { movementId } = req.params;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const movement = await this.repository.approveMovement(tenantId, movementId, userId);
      
      res.json({
        success: true,
        data: movement,
        message: 'Movimentação aprovada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao aprovar movimentação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== ENTRADA DE ESTOQUE =====
  createStockEntry = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const entryData = {
        ...req.body,
        movement_type: 'IN' as const,
        movement_subtype: req.body.movement_subtype || 'PURCHASE'
      };

      const movement = await this.repository.createMovement(tenantId, userId, entryData);
      
      // Se há lote/serial, criar registro de lote
      if (req.body.lot_number && req.body.original_quantity) {
        const lotData = {
          part_id: req.body.part_id,
          location_id: req.body.location_id,
          lot_number: req.body.lot_number,
          serial_number: req.body.serial_number,
          original_quantity: req.body.original_quantity,
          manufacturing_date: req.body.manufacturing_date ? new Date(req.body.manufacturing_date) : undefined,
          expiration_date: req.body.expiration_date ? new Date(req.body.expiration_date) : undefined,
          unit_cost: req.body.unit_cost
        };
        
        await this.repository.createLot(tenantId, lotData);
      }
      
      res.json({
        success: true,
        data: movement,
        message: 'Entrada de estoque registrada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== SAÍDA DE ESTOQUE =====
  createStockExit = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const exitData = {
        ...req.body,
        movement_type: 'OUT' as const,
        movement_subtype: req.body.movement_subtype || 'SALE'
      };

      const movement = await this.repository.createMovement(tenantId, userId, exitData);
      
      res.json({
        success: true,
        data: movement,
        message: 'Saída de estoque registrada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== TRANSFERÊNCIA ENTRE LOCAIS =====
  createStockTransfer = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      const { source_location_id, destination_location_id } = req.body;
      
      if (!source_location_id || !destination_location_id) {
        return res.status(400).json({
          success: false,
          message: 'Locais de origem e destino são obrigatórios para transferência'
        });
      }

      const transferData = {
        ...req.body,
        movement_type: 'TRANSFER' as const,
        location_id: source_location_id // Para o registro da movimentação
      };

      const movement = await this.repository.createMovement(tenantId, userId, transferData);
      
      res.json({
        success: true,
        data: movement,
        message: 'Transferência registrada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao registrar transferência:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== LOTES E RASTREABILIDADE =====
  getLots = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const partId = req.query.partId as string;
      const locationId = req.query.locationId as string;
      
      const lots = await this.repository.findLots(tenantId, partId, locationId);
      res.json(lots);
      
    } catch (error) {
      console.error('Erro ao buscar lotes:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getExpiringLots = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const daysAhead = parseInt(req.query.daysAhead as string) || 30;
      
      const expiringLots = await this.repository.getExpiringLots(tenantId, daysAhead);
      res.json(expiringLots);
      
    } catch (error) {
      console.error('Erro ao buscar lotes vencendo:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // ===== RELATÓRIOS =====
  getStockTurnoverReport = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      const report = await this.repository.getStockTurnoverReport(tenantId, startDate, endDate);
      res.json(report);
      
    } catch (error) {
      console.error('Erro ao gerar relatório de giro:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  getInventoryValuation = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const valuation = await this.repository.getInventoryValuation(tenantId);
      res.json(valuation);
      
    } catch (error) {
      console.error('Erro ao buscar avaliação de inventário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}
