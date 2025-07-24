import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { DrizzleItemRepository } from '../../infrastructure/repositories/DrizzleItemRepository';
import { DrizzleSupplierRepository } from '../../infrastructure/repositories/DrizzleSupplierRepository';
import { CreateItemSchema, UpdateItemSchema } from '../../domain/entities/Item';
import { CreateSupplierSchema, UpdateSupplierSchema } from '../../domain/entities/Supplier';

export class PartsServicesController {
  private itemRepository = new DrizzleItemRepository();
  private supplierRepository = new DrizzleSupplierRepository();

  // ==================== DASHBOARD ====================
  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const [
        totalItems,
        itemsByType,
        totalSuppliers,
        activeSuppliers,
      ] = await Promise.all([
        this.itemRepository.getTotalCount(tenantId),
        this.itemRepository.countByType(tenantId),
        this.supplierRepository.getTotalCount(tenantId),
        this.supplierRepository.getActiveCount(tenantId),
      ]);

      res.json({
        totalItems,
        materials: itemsByType.materials,
        services: itemsByType.services,
        totalSuppliers,
        activeSuppliers,
        stockAlerts: 0, // TODO: Implementar quando criar controle de estoque
        pendingOrders: 0, // TODO: Implementar quando criar pedidos
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  };

  // ==================== ITENS ====================
  getItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { 
        active, 
        type, 
        group, 
        search, 
        limit = 50, 
        offset = 0 
      } = req.query;

      const filters = {
        active: active ? active === 'true' : undefined,
        type: type as 'Material' | 'Serviço' | undefined,
        group: group as string | undefined,
        search: search as string | undefined,
        limit: Number(limit),
        offset: Number(offset),
      };

      const items = await this.itemRepository.findAll(tenantId, filters);

      res.json({ 
        items,
        total: items.length,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Failed to fetch items' });
    }
  };

  getItemById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const item = await this.itemRepository.findById(tenantId, id);

      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.json({ item });
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).json({ message: 'Failed to fetch item' });
    }
  };

  createItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const validatedData = CreateItemSchema.parse(req.body);
      const item = await this.itemRepository.create(tenantId, validatedData);

      res.status(201).json({ 
        message: 'Item created successfully', 
        item 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      console.error('Error creating item:', error);
      res.status(500).json({ message: 'Failed to create item' });
    }
  };

  updateItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const validatedData = UpdateItemSchema.parse({ ...req.body, id });

      const item = await this.itemRepository.update(tenantId, id, validatedData);

      res.json({ 
        message: 'Item updated successfully', 
        item 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      console.error('Error updating item:', error);
      res.status(500).json({ message: 'Failed to update item' });
    }
  };

  deleteItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      await this.itemRepository.delete(tenantId, id);

      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Failed to delete item' });
    }
  };

  // ==================== FORNECEDORES ====================
  getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { 
        active, 
        city, 
        state, 
        search, 
        limit = 50, 
        offset = 0 
      } = req.query;

      const filters = {
        active: active ? active === 'true' : undefined,
        city: city as string | undefined,
        state: state as string | undefined,
        search: search as string | undefined,
        limit: Number(limit),
        offset: Number(offset),
      };

      const suppliers = await this.supplierRepository.findAll(tenantId, filters);

      res.json({ 
        suppliers,
        total: suppliers.length,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ message: 'Failed to fetch suppliers' });
    }
  };

  getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const supplier = await this.supplierRepository.findById(tenantId, id);

      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      res.json({ supplier });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({ message: 'Failed to fetch supplier' });
    }
  };

  createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const validatedData = CreateSupplierSchema.parse(req.body);
      const supplier = await this.supplierRepository.create(tenantId, validatedData);

      res.status(201).json({ 
        message: 'Supplier created successfully', 
        supplier 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      console.error('Error creating supplier:', error);
      res.status(500).json({ message: 'Failed to create supplier' });
    }
  };

  updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      const validatedData = UpdateSupplierSchema.parse({ ...req.body, id });

      const supplier = await this.supplierRepository.update(tenantId, id, validatedData);

      res.json({ 
        message: 'Supplier updated successfully', 
        supplier 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      console.error('Error updating supplier:', error);
      res.status(500).json({ message: 'Failed to update supplier' });
    }
  };

  deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { id } = req.params;
      await this.supplierRepository.delete(tenantId, id);

      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ message: 'Failed to delete supplier' });
    }
  };

  // ==================== MÉTODOS SIMPLIFICADOS PARA COMPATIBILIDADE ====================
  // Métodos básicos para outras funcionalidades que serão implementadas depois

  getCustomerCompanies = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ companies: [] }); // Placeholder
  };

  createCustomerCompany = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };

  updateCustomerCompany = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };

  deleteCustomerCompany = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };

  getStockLocations = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ locations: [] }); // Placeholder
  };

  createStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };

  getInventory = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ inventory: [] }); // Placeholder
  };

  updateInventory = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };

  getStockMovements = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ movements: [] }); // Placeholder
  };

  createStockMovement = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };

  getServiceKits = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ kits: [] }); // Placeholder
  };

  createServiceKit = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };

  getPriceLists = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ priceLists: [] }); // Placeholder
  };

  createPriceList = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };

  getAssets = async (req: AuthenticatedRequest, res: Response) => {
    res.json({ assets: [] }); // Placeholder
  };

  createAsset = async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: 'Not implemented yet' });
  };
}