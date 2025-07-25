
import { Request, Response } from 'express';
import { PartsServicesRepository } from './repository';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class PartsServicesController {
  private repository = new PartsServicesRepository();

  // ============================================
  // ITEMS ENDPOINTS
  // ============================================
  
  createItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const item = await this.repository.createItem(tenantId, req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        type: req.query.type as string,
        status: req.query.status as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      const items = await this.repository.getItems(tenantId, filters);
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getItemById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const item = await this.repository.getItemById(tenantId, id);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.json(item);
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  updateItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const updated = await this.repository.updateItem(tenantId, id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  deleteItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const deleted = await this.repository.deleteItem(tenantId, id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  // ============================================
  // SUPPLIERS ENDPOINTS
  // ============================================

  createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const supplier = await this.repository.createSupplier(tenantId, req.body);
      res.status(201).json(supplier);
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const filters = {
        search: req.query.search as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      const suppliers = await this.repository.getSuppliers(tenantId, filters);
      res.json(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const supplier = await this.repository.getSupplierById(tenantId, id);
      
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      res.json(supplier);
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const updated = await this.repository.updateSupplier(tenantId, id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const deleted = await this.repository.deleteSupplier(tenantId, id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  // ============================================
  // STOCK LOCATIONS ENDPOINTS
  // ============================================

  createStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const location = await this.repository.createStockLocation(tenantId, req.body);
      res.status(201).json(location);
    } catch (error) {
      console.error('Error creating stock location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getStockLocations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const filters = {
        search: req.query.search as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      const locations = await this.repository.getStockLocations(tenantId, filters);
      res.json(locations);
    } catch (error) {
      console.error('Error fetching stock locations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getStockLocationById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const location = await this.repository.getStockLocationById(tenantId, id);
      
      if (!location) {
        return res.status(404).json({ message: 'Stock location not found' });
      }

      res.json(location);
    } catch (error) {
      console.error('Error fetching stock location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  updateStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const updated = await this.repository.updateStockLocation(tenantId, id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: 'Stock location not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating stock location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  deleteStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const deleted = await this.repository.deleteStockLocation(tenantId, id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Stock location not found' });
      }

      res.json({ message: 'Stock location deleted successfully' });
    } catch (error) {
      console.error('Error deleting stock location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================

  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const stats = await this.repository.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  // ============================================
  // PLACEHOLDER METHODS FOR REMAINING ROUTES
  // ============================================

  getStockLevels = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Stock levels endpoint - to be implemented' });
  };

  updateStockLevel = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Update stock level endpoint - to be implemented' });
  };

  createStockMovement = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Create stock movement endpoint - to be implemented' });
  };

  getStockMovements = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get stock movements endpoint - to be implemented' });
  };

  createSupplierCatalogItem = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Create supplier catalog item endpoint - to be implemented' });
  };

  getSupplierCatalog = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get supplier catalog endpoint - to be implemented' });
  };

  updateSupplierCatalogItem = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Update supplier catalog item endpoint - to be implemented' });
  };

  deleteSupplierCatalogItem = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Delete supplier catalog item endpoint - to be implemented' });
  };

  createItemLink = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Create item link endpoint - to be implemented' });
  };

  getItemLinks = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get item links endpoint - to be implemented' });
  };

  deleteItemLink = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Delete item link endpoint - to be implemented' });
  };

  createItemCustomerLink = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Create item customer link endpoint - to be implemented' });
  };

  getItemCustomerLinks = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get item customer links endpoint - to be implemented' });
  };

  updateItemCustomerLink = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Update item customer link endpoint - to be implemented' });
  };

  createItemSupplierLink = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Create item supplier link endpoint - to be implemented' });
  };

  getItemSupplierLinks = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get item supplier links endpoint - to be implemented' });
  };

  uploadItemAttachment = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Upload item attachment endpoint - to be implemented' });
  };

  getItemAttachments = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get item attachments endpoint - to be implemented' });
  };

  deleteItemAttachment = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Delete item attachment endpoint - to be implemented' });
  };

  createServiceKit = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Create service kit endpoint - to be implemented' });
  };

  getServiceKits = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get service kits endpoint - to be implemented' });
  };

  addItemToKit = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Add item to kit endpoint - to be implemented' });
  };

  getKitItems = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get kit items endpoint - to be implemented' });
  };

  getInventoryStats = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get inventory stats endpoint - to be implemented' });
  };

  createStockTransfer = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Create stock transfer endpoint - to be implemented' });
  };

  getStockTransfers = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get stock transfers endpoint - to be implemented' });
  };

  getServiceKitById = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Get service kit by ID endpoint - to be implemented' });
  };
}
