import { Request, Response } from 'express';
import { StockRepository } from '../../infrastructure/repositories/StockRepository';
import type { AuthenticatedRequest } from '../../../../middleware/jwtAuth';

export class StockController {
  constructor(private stockRepository: StockRepository) {}

  async getStockItems(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
      }

      const {
        limit,
        offset,
        search,
        warehouseId,
        status
      } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        search: search as string,
        warehouseId: warehouseId as string,
        status: status as string
      };

      const stockItems = await this.stockRepository.getStockItems(tenantId, options);

      res.json({
        success: true,
        data: stockItems
      });
    } catch (error) {
      console.error('Error getting stock items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get stock items'
      });
    }
  }

  async getStockStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
      }

      const stats = await this.stockRepository.getStockStats(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting stock stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get stock stats'
      });
    }
  }

  async getStockMovements(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
      }

      const {
        limit,
        offset,
        itemId,
        warehouseId,
        movementType
      } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        itemId: itemId as string,
        warehouseId: warehouseId as string,
        movementType: movementType as string
      };

      const movements = await this.stockRepository.getStockMovements(tenantId, options);

      res.json({
        success: true,
        data: movements
      });
    } catch (error) {
      console.error('Error getting stock movements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get stock movements'
      });
    }
  }

  async getWarehouses(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
      }

      const warehouses = await this.stockRepository.getWarehouses(tenantId);

      res.json({
        success: true,
        data: warehouses
      });
    } catch (error) {
      console.error('Error getting warehouses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get warehouses'
      });
    }
  }

  async createStockMovement(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const {
        itemId,
        warehouseId,
        movementType,
        quantity,
        unitCost,
        reason
      } = req.body;

      // Basic validation
      if (!itemId || !warehouseId || !movementType || !quantity || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const movementData = {
        itemId,
        warehouseId,
        movementType,
        quantity: parseInt(quantity),
        unitCost: unitCost ? parseFloat(unitCost) : undefined,
        reason,
        createdBy: userId
      };

      const movement = await this.stockRepository.createStockMovement(tenantId, movementData);

      res.status(201).json({
        success: true,
        data: movement
      });
    } catch (error) {
      console.error('Error creating stock movement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create stock movement'
      });
    }
  }

  async createStockAdjustment(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const {
        itemId,
        warehouseId,
        newQuantity,
        reason
      } = req.body;

      // Basic validation
      if (!itemId || !warehouseId || newQuantity === undefined || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const adjustmentData = {
        itemId,
        warehouseId,
        newQuantity: parseInt(newQuantity),
        reason,
        createdBy: userId
      };

      const adjustment = await this.stockRepository.createStockAdjustment(tenantId, adjustmentData);

      res.status(201).json({
        success: true,
        data: adjustment
      });
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create stock adjustment'
      });
    }
  }
}