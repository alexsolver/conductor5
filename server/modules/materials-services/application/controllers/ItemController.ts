import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';

export class ItemController {
  async getItems(req: AuthenticatedRequest, res: Response) {
    try {
      // Mock implementation - replace with actual repository calls
      const items = [
        {
          id: '1',
          name: 'Item de Exemplo',
          description: 'Descrição do item',
          category: 'Material',
          unit: 'UN',
          price: 100.00,
          isActive: true
        }
      ];

      res.json({ success: true, data: items });
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
  }

  async createItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, category, unit, price } = req.body;

      const newItem = {
        id: Date.now().toString(),
        name,
        description,
        category,
        unit,
        price,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ success: true, data: newItem });
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ success: false, message: 'Failed to create item' });
    }
  }

  async getItemById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const item = {
        id,
        name: 'Item de Exemplo',
        description: 'Descrição do item',
        category: 'Material',
        unit: 'UN',
        price: 100.00,
        isActive: true
      };

      res.json({ success: true, data: item });
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch item' });
    }
  }

  async updateItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedItem = {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      res.json({ success: true, data: updatedItem });
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ success: false, message: 'Failed to update item' });
    }
  }

  async deleteItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ success: false, message: 'Failed to delete item' });
    }
  }
}