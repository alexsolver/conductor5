import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';

export class SupplierController {
  async getSuppliers(req: AuthenticatedRequest, res: Response) {
    try {
      const suppliers = [
        {
          id: '1',
          name: 'Fornecedor Exemplo Ltda',
          document: '12.345.678/0001-90',
          email: 'contato@fornecedor.com',
          phone: '(11) 1234-5678',
          address: 'Rua Exemplo, 123',
          city: 'São Paulo',
          state: 'SP',
          isActive: true
        }
      ];

      res.json({ success: true, data: suppliers });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
    }
  }

  async createSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, document, email, phone, address, city, state } = req.body;

      const newSupplier = {
        id: Date.now().toString(),
        name,
        document,
        email,
        phone,
        address,
        city,
        state,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ success: true, data: newSupplier });
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ success: false, message: 'Failed to create supplier' });
    }
  }

  async getSupplierById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const supplier = {
        id,
        name: 'Fornecedor Exemplo Ltda',
        document: '12.345.678/0001-90',
        email: 'contato@fornecedor.com',
        phone: '(11) 1234-5678',
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        isActive: true
      };

      res.json({ success: true, data: supplier });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch supplier' });
    }
  }

  async updateSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedSupplier = {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      res.json({ success: true, data: updatedSupplier });
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ success: false, message: 'Failed to update supplier' });
    }
  }

  async deleteSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ success: false, message: 'Failed to delete supplier' });
    }
  }
}