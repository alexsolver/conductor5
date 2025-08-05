import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';

export class StockController {
  async getStockItems(req: AuthenticatedRequest, res: Response) {
    try {
      const stockItems = [
        {
          id: '1',
          itemId: '1',
          itemName: 'Item de Exemplo',
          quantity: 100,
          reservedQuantity: 10,
          availableQuantity: 90,
          location: 'Estoque Principal',
          lastUpdated: new Date().toISOString()
        }
      ];

      res.json({ success: true, data: stockItems });
    } catch (error) {
      console.error('Error fetching stock items:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch stock items' });
    }
  }

  async createStockItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId, quantity, location } = req.body;

      const newStockItem = {
        id: Date.now().toString(),
        itemId,
        quantity,
        reservedQuantity: 0,
        availableQuantity: quantity,
        location,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ success: true, data: newStockItem });
    } catch (error) {
      console.error('Error creating stock item:', error);
      res.status(500).json({ success: false, message: 'Failed to create stock item' });
    }
  }

  async getStockItemById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const stockItem = {
        id,
        itemId: '1',
        itemName: 'Item de Exemplo',
        quantity: 100,
        reservedQuantity: 10,
        availableQuantity: 90,
        location: 'Estoque Principal'
      };

      res.json({ success: true, data: stockItem });
    } catch (error) {
      console.error('Error fetching stock item:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch stock item' });
    }
  }

  async updateStockItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedStockItem = {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      res.json({ success: true, data: updatedStockItem });
    } catch (error) {
      console.error('Error updating stock item:', error);
      res.status(500).json({ success: false, message: 'Failed to update stock item' });
    }
  }

  async deleteStockItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      res.json({ success: true, message: 'Stock item deleted successfully' });
    } catch (error) {
      console.error('Error deleting stock item:', error);
      res.status(500).json({ success: false, message: 'Failed to delete stock item' });
    }
  }
}