
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';

export class AssetManagementController {
  async getAssets(req: AuthenticatedRequest, res: Response) {
    try {
      const assets = [
        {
          id: '1',
          name: 'Equipamento Exemplo',
          type: 'Equipamento',
          serialNumber: 'EQ001',
          status: 'Ativo',
          location: 'Setor A',
          acquisitionDate: '2024-01-15',
          value: 5000.00,
          isActive: true
        }
      ];
      
      res.json({ success: true, data: assets });
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch assets' });
    }
  }

  async createAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, type, serialNumber, location, acquisitionDate, value } = req.body;
      
      const newAsset = {
        id: Date.now().toString(),
        name,
        type,
        serialNumber,
        status: 'Ativo',
        location,
        acquisitionDate,
        value,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({ success: true, data: newAsset });
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ success: false, message: 'Failed to create asset' });
    }
  }

  async getAssetById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const asset = {
        id,
        name: 'Equipamento Exemplo',
        type: 'Equipamento',
        serialNumber: 'EQ001',
        status: 'Ativo',
        location: 'Setor A',
        acquisitionDate: '2024-01-15',
        value: 5000.00,
        isActive: true
      };
      
      res.json({ success: true, data: asset });
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch asset' });
    }
  }

  async updateAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedAsset = {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      res.json({ success: true, data: updatedAsset });
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({ success: false, message: 'Failed to update asset' });
    }
  }

  async deleteAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      
      res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ success: false, message: 'Failed to delete asset' });
    }
  }
}
