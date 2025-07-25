import { Request, Response } from 'express';
import { SupplierRepository } from '../../infrastructure/repositories/SupplierRepository';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';

export class SupplierController {
  constructor(private supplierRepository: SupplierRepository) {}

  async createSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const supplierData = {
        ...req.body,
        tenantId,
        createdBy: req.user?.id
      };

      const supplier = await this.supplierRepository.create(supplierData);
      
      res.status(201).json({
        success: true,
        data: supplier,
        message: 'Supplier created successfully'
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create supplier'
      });
    }
  }

  async getSuppliers(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const {
        limit = 50,
        offset = 0,
        search,
        active
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        search: search as string,
        active: active === 'true' ? true : active === 'false' ? false : undefined
      };

      const suppliers = await this.supplierRepository.findByTenant(tenantId, options);
      
      res.json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suppliers'
      });
    }
  }

  async getSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const supplier = await this.supplierRepository.findById(id, tenantId);
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Get catalog
      const catalog = await this.supplierRepository.getCatalog(id, tenantId);

      res.json({
        success: true,
        data: {
          ...supplier,
          catalog
        }
      });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supplier'
      });
    }
  }

  async updateSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user?.id
      };

      const supplier = await this.supplierRepository.update(id, tenantId, updateData);
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      res.json({
        success: true,
        data: supplier,
        message: 'Supplier updated successfully'
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update supplier'
      });
    }
  }

  async deleteSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const deleted = await this.supplierRepository.delete(id, tenantId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      res.json({
        success: true,
        message: 'Supplier deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete supplier'
      });
    }
  }

  async addCatalogItem(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const catalogData = {
        ...req.body,
        tenantId,
        supplierId: id
      };

      const catalogItem = await this.supplierRepository.addCatalogItem(catalogData);
      
      res.status(201).json({
        success: true,
        data: catalogItem,
        message: 'Catalog item added successfully'
      });
    } catch (error) {
      console.error('Error adding catalog item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add catalog item'
      });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const stats = await this.supplierRepository.getStats(tenantId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stats'
      });
    }
  }
}