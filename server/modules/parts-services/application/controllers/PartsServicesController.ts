import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { DrizzleItemRepository } from '../../infrastructure/repositories/DrizzleItemRepository';
import { DrizzleSupplierRepository } from '../../infrastructure/repositories/DrizzleSupplierRepository';
import { DirectPartsServicesRepository } from '../../infrastructure/repositories/DirectPartsServicesRepository';
import { CreateItemSchema, UpdateItemSchema } from '../../domain/entities/Item';
import { CreateSupplierSchema, UpdateSupplierSchema } from '../../domain/entities/Supplier';
import { 
  insertItemSchema, insertSupplierSchema, insertStockLocationSchema, 
  insertStockMovementSchema, insertServiceKitSchema, insertPriceListSchema, 
  insertAssetSchema 
} from '@shared/schema-parts-services';

export class PartsServicesController {
  private itemRepository = new DrizzleItemRepository();
  private supplierRepository = new DrizzleSupplierRepository();
  private directRepository = new DirectPartsServicesRepository();

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

      // Usa o novo repository para stats avançadas
      const advancedStats = await this.directRepository.getDashboardStats(tenantId);

      res.json({
        totalItems: advancedStats.totalItems,
        materials: advancedStats.materials,
        services: advancedStats.services,
        totalSuppliers: advancedStats.totalSuppliers,
        activeSuppliers: advancedStats.activeSuppliers,
        stockAlerts: advancedStats.stockAlerts,
        totalAssets: advancedStats.totalAssets,
        pendingOrders: advancedStats.pendingOrders,
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

  // ==================== CONTROLE DE ESTOQUE ====================
  getStockLocations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const locations = await this.directRepository.getStockLocations(tenantId);
      res.json({ locations });
    } catch (error) {
      console.error('Error getting stock locations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  createStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const validatedData = insertStockLocationSchema.parse(req.body);
      const location = await this.directRepository.createStockLocation(tenantId, validatedData);

      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating stock location:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getStockLevels = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { itemId, locationId } = req.query;
      const stockLevels = await this.directRepository.getStockLevels(
        tenantId, 
        itemId as string, 
        locationId as string
      );

      res.json({ stockLevels });
    } catch (error) {
      console.error('Error getting stock levels:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  createStockMovement = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const validatedData = insertStockMovementSchema.parse({
        ...req.body,
        userId
      });
      
      const movement = await this.directRepository.createStockMovement(tenantId, validatedData);

      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating stock movement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getStockMovements = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { limit = 50, offset = 0 } = req.query;
      const movements = await this.directRepository.getStockMovements(
        tenantId,
        Number(limit),
        Number(offset)
      );

      res.json({ movements });
    } catch (error) {
      console.error('Error getting stock movements:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  // ==================== KITS DE SERVIÇO ====================
  getServiceKits = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const kits = await this.directRepository.getServiceKits(tenantId);
      res.json({ kits });
    } catch (error) {
      console.error('Error getting service kits:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  createServiceKit = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const validatedData = insertServiceKitSchema.parse(req.body);
      const kit = await this.directRepository.createServiceKit(tenantId, validatedData);

      res.status(201).json(kit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating service kit:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getServiceKitItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitId } = req.params;
      const kitItems = await this.directRepository.getServiceKitItems(kitId);

      res.json({ kitItems });
    } catch (error) {
      console.error('Error getting service kit items:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  // ==================== LISTAS DE PREÇOS ====================
  getPriceLists = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const priceLists = await this.directRepository.getPriceLists(tenantId);
      res.json({ priceLists });
    } catch (error) {
      console.error('Error getting price lists:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  createPriceList = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const validatedData = insertPriceListSchema.parse(req.body);
      const priceList = await this.directRepository.createPriceList(tenantId, validatedData);

      res.status(201).json(priceList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating price list:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  getPriceListItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { priceListId } = req.params;
      const priceItems = await this.directRepository.getPriceListItems(priceListId);

      res.json({ priceItems });
    } catch (error) {
      console.error('Error getting price list items:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  // ==================== CONTROLE DE ATIVOS ====================
  getAssets = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const { limit = 50, offset = 0 } = req.query;
      const assets = await this.directRepository.getAssets(
        tenantId,
        Number(limit),
        Number(offset)
      );

      res.json({ assets });
    } catch (error) {
      console.error('Error getting assets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  createAsset = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID required' });
      }

      const validatedData = insertAssetSchema.parse(req.body);
      const asset = await this.directRepository.createAsset(tenantId, validatedData);

      res.status(201).json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating asset:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

}