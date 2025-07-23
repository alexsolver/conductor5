import { Request, Response } from 'express';
import { DirectPartsServicesRepository } from '../../infrastructure/repositories/DirectPartsServicesRepository';
import { 
  insertPartSchema, 
  insertSupplierSchema, 
  insertInventorySchema, 
  insertServiceKitSchema,
  InsertActivityType,
  updatePartSchema,
  updateSupplierSchema,
  updateServiceKitSchema
} from '@shared/schema';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
  };
}

export class PartsServicesController {
  private repository: DirectPartsServicesRepository;

  constructor(repository?: DirectPartsServicesRepository) {
    this.repository = repository || new DirectPartsServicesRepository();
  }

  // ===== ACTIVITY TYPES =====
  createActivityType = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const data = req.body as InsertActivityType;
      const activityType = await this.repository.createActivityType({...data, tenantId});
      
      res.status(201).json(activityType);
    } catch (error) {
      console.error('Error creating activity type:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getActivityTypes = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const activityTypes = await this.repository.findActivityTypes(tenantId);
      res.json(activityTypes);
    } catch (error) {
      console.error('Error fetching activity types:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getActivityTypeById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const activityType = await this.repository.findActivityTypeById(id, tenantId);
      
      if (!activityType) {
        return res.status(404).json({ error: 'Activity type not found' });
      }
      
      res.json(activityType);
    } catch (error) {
      console.error('Error fetching activity type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateActivityType = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const data = req.body as Partial<InsertActivityType>;
      
      const activityType = await this.repository.updateActivityType(id, tenantId, data);
      res.json(activityType);
    } catch (error) {
      console.error('Error updating activity type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteActivityType = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const success = await this.repository.deleteActivityType(id, tenantId);
      
      if (!success) {
        return res.status(404).json({ error: 'Activity type not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting activity type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== PARTS =====
  createPart = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const data = {
        ...req.body,
        tenantId,
        createdById: req.user?.id,
        updatedById: req.user?.id
      };
      
      const part = await this.repository.createPart(tenantId, data);
      res.status(201).json(part);
    } catch (error) {
      console.error('Error creating part:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getParts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const parts = await this.repository.findParts(tenantId, filters);
      res.json(parts);
    } catch (error) {
      console.error('Error fetching parts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPartsStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const stats = await this.repository.getPartsStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching parts stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPartById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const part = await this.repository.findPartById(id, tenantId);
      
      if (!part) {
        return res.status(404).json({ error: 'Part not found' });
      }
      
      res.json(part);
    } catch (error) {
      console.error('Error fetching part:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updatePart = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const data = updatePartSchema.parse({
        ...req.body,
        updatedById: req.user?.id
      });
      
      const part = await this.repository.updatePart(id, tenantId, data);
      res.json(part);
    } catch (error) {
      console.error('Error updating part:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deletePart = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const part = await this.repository.deletePart(id, tenantId);
      res.json(part);
    } catch (error) {
      console.error('Error deleting part:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPartsStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const totalParts = await this.repository.getPartsCount(tenantId);
      
      res.json({
        totalParts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching parts stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== SERVICE KITS =====
  createServiceKit = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const data = insertServiceKitSchema.parse({
        ...req.body,
        createdById: req.user?.id,
        updatedById: req.user?.id
      });
      
      const serviceKit = await this.repository.createServiceKit(tenantId, data);
      res.status(201).json(serviceKit);
    } catch (error) {
      console.error('Error creating service kit:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getServiceKits = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        kitType: req.query.kitType as string,
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const serviceKits = await this.repository.findServiceKits(tenantId, filters);
      res.json(serviceKits);
    } catch (error) {
      console.error('Error fetching service kits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getServiceKitById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const serviceKit = await this.repository.findServiceKitById(id, tenantId);
      
      if (!serviceKit) {
        return res.status(404).json({ error: 'Service kit not found' });
      }
      
      res.json(serviceKit);
    } catch (error) {
      console.error('Error fetching service kit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateServiceKit = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const data = updateServiceKitSchema.parse({
        ...req.body,
        updatedById: req.user?.id
      });
      
      const serviceKit = await this.repository.updateServiceKit(id, tenantId, data);
      res.json(serviceKit);
    } catch (error) {
      console.error('Error updating service kit:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteServiceKit = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const serviceKit = await this.repository.deleteServiceKit(id, tenantId);
      res.json(serviceKit);
    } catch (error) {
      console.error('Error deleting service kit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== SUPPLIERS =====
  createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const data = insertSupplierSchema.parse({
        ...req.body,
        createdById: req.user?.id,
        updatedById: req.user?.id
      });
      
      const supplier = await this.repository.createSupplier(tenantId, data);
      res.status(201).json(supplier);
    } catch (error) {
      console.error('Error creating supplier:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const suppliers = await this.repository.findSuppliers(tenantId, filters);
      res.json(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const supplier = await this.repository.findSupplierById(id, tenantId);
      
      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      
      res.json(supplier);
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const data = updateSupplierSchema.parse({
        ...req.body,
        updatedById: req.user?.id
      });
      
      const supplier = await this.repository.updateSupplier(id, tenantId, data);
      res.json(supplier);
    } catch (error) {
      console.error('Error updating supplier:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const supplier = await this.repository.deleteSupplier(id, tenantId);
      res.json(supplier);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== INVENTORY =====
  createInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const data = insertInventorySchema.parse(req.body);
      const inventoryItem = await this.repository.createInventory(tenantId, data);
      res.status(201).json(inventoryItem);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getInventory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        partId: req.query.partId as string,
        locationId: req.query.locationId as string,
        lowStock: req.query.lowStock === 'true',
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const inventory = await this.repository.findInventory(tenantId, filters);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  adjustInventory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { partId } = req.params;
      const { locationId, adjustment, reason } = req.body;

      if (!locationId || adjustment === undefined || !reason) {
        return res.status(400).json({ error: 'locationId, adjustment, and reason are required' });
      }

      const inventoryItem = await this.repository.adjustInventoryQuantity(
        partId,
        tenantId,
        locationId,
        adjustment,
        reason
      );
      
      res.json(inventoryItem);
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== DASHBOARD STATS =====
  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const [
        totalParts,
        totalSuppliers,
        totalServiceKits
      ] = await Promise.all([
        this.repository.getPartsCount(tenantId),
        this.repository.getSuppliersCount(tenantId),
        this.repository.getServiceKitsCount(tenantId)
      ]);

      res.json({
        totalParts,
        totalSuppliers,
        totalServiceKits,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== STOCK MOVEMENTS =====
  createStockMovement = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const movementData = {
        ...req.body,
        createdById: userId
      };

      const newMovement = await this.repository.createStockMovement(tenantId, movementData);
      res.status(201).json(newMovement);
    } catch (error) {
      console.error('Error creating stock movement:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getStockMovements = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        partId: req.query.partId as string,
        movementType: req.query.movementType as string
      };

      const movements = await this.repository.findStockMovements(tenantId, filters);
      res.json(movements);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== QUOTATIONS =====
  createQuotation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const quotationData = {
        ...req.body,
        createdById: userId
      };

      const newQuotation = await this.repository.createQuotation(tenantId, quotationData);
      res.status(201).json(newQuotation);
    } catch (error) {
      console.error('Error creating quotation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getQuotations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        status: req.query.status as string
      };

      const quotations = await this.repository.findQuotations(tenantId, filters);
      res.json(quotations);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateQuotationStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const { status } = req.body;

      const updatedQuotation = await this.repository.updateQuotationStatus(id, tenantId, status);
      res.json(updatedQuotation);
    } catch (error) {
      console.error('Error updating quotation status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== PURCHASE ORDERS =====
  createPurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const poData = {
        ...req.body,
        createdById: userId
      };

      const newPO = await this.repository.createPurchaseOrder(tenantId, poData);
      res.status(201).json(newPO);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPurchaseOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        status: req.query.status as string
      };

      const purchaseOrders = await this.repository.findPurchaseOrders(tenantId, filters);
      res.json(purchaseOrders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updatePurchaseOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const { status } = req.body;

      const updatedPO = await this.repository.updatePurchaseOrderStatus(id, tenantId, status);
      res.json(updatedPO);
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== ASSETS =====
  createAsset = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const assetData = {
        ...req.body,
        createdById: userId
      };

      const newAsset = await this.repository.createAsset(tenantId, assetData);
      res.status(201).json(newAsset);
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getAssets = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        category: req.query.category as string,
        status: req.query.status as string
      };

      const assets = await this.repository.findAssets(tenantId, filters);
      res.json(assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateAssetStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const { id } = req.params;
      const { status } = req.body;

      const updatedAsset = await this.repository.updateAssetStatus(id, tenantId, status);
      res.json(updatedAsset);
    } catch (error) {
      console.error('Error updating asset status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== PRICE LISTS =====
  createPriceList = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const priceListData = {
        ...req.body,
        createdById: userId
      };

      const newPriceList = await this.repository.createPriceList(tenantId, priceListData);
      res.status(201).json(newPriceList);
    } catch (error) {
      console.error('Error creating price list:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPriceLists = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        status: req.query.status as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };

      const priceLists = await this.repository.findPriceLists(tenantId, filters);
      res.json(priceLists);
    } catch (error) {
      console.error('Error fetching price lists:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== SUPPLIER EVALUATIONS =====
  createSupplierEvaluation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const evaluationData = {
        ...req.body,
        evaluatorId: userId
      };

      const newEvaluation = await this.repository.createSupplierEvaluation(tenantId, evaluationData);
      res.status(201).json(newEvaluation);
    } catch (error) {
      console.error('Error creating supplier evaluation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getSupplierEvaluations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const supplierId = req.query.supplierId as string;
      const evaluations = await this.repository.findSupplierEvaluations(tenantId, supplierId);
      res.json(evaluations);
    } catch (error) {
      console.error('Error fetching supplier evaluations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== AUDIT LOGS =====
  createAuditLog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const auditData = {
        ...req.body,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const newAuditLog = await this.repository.createAuditLog(tenantId, auditData);
      res.status(201).json(newAuditLog);
    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const filters = {
        tableName: req.query.tableName as string,
        recordId: req.query.recordId as string
      };

      const auditLogs = await this.repository.findAuditLogs(tenantId, filters);
      res.json(auditLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== DASHBOARD STATS =====
  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }

      const stats = await this.repository.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // =====================================================
  // MÓDULOS AVANÇADOS 1-4: ENDPOINTS EXPANSÃO COMPLETA
  // =====================================================

  // MÓDULO 1: Categorias de peças
  createPartCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const category = await this.repository.createPartCategory(tenantId, req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating part category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPartCategories = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const categories = await this.repository.findPartCategories(tenantId);
      res.json(categories);
    } catch (error) {
      console.error('Error getting part categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // MÓDULO 2: Localizações de estoque
  createStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const location = await this.repository.createStockLocation(tenantId, req.body);
      res.status(201).json(location);
    } catch (error) {
      console.error('Error creating stock location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getStockLocations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const locations = await this.repository.findStockLocations(tenantId);
      res.json(locations);
    } catch (error) {
      console.error('Error getting stock locations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // MÓDULO 2: Inventário multi-localização
  createInventoryMultiLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const inventory = await this.repository.createInventoryMultiLocation(tenantId, req.body);
      res.status(201).json(inventory);
    } catch (error) {
      console.error('Error creating inventory multi-location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getInventoryByLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const { locationId } = req.query;
      const inventory = await this.repository.findInventoryByLocation(tenantId, locationId as string);
      res.json(inventory);
    } catch (error) {
      console.error('Error getting inventory by location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // MÓDULO 2: Reservas de estoque
  createStockReservation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const reservationData = { ...req.body, createdBy: userId };
      const reservation = await this.repository.createStockReservation(tenantId, reservationData);
      res.status(201).json(reservation);
    } catch (error) {
      console.error('Error creating stock reservation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getStockReservations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const { status } = req.query;
      const reservations = await this.repository.findStockReservations(tenantId, status as string);
      res.json(reservations);
    } catch (error) {
      console.error('Error getting stock reservations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // MÓDULO 3: Catálogo de fornecedores
  createSupplierCatalogItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const catalogItem = await this.repository.createSupplierCatalogItem(tenantId, req.body);
      res.status(201).json(catalogItem);
    } catch (error) {
      console.error('Error creating supplier catalog item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getSupplierCatalog = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const { supplierId, partId } = req.query;
      const catalog = await this.repository.findSupplierCatalog(tenantId, supplierId as string, partId as string);
      res.json(catalog);
    } catch (error) {
      console.error('Error getting supplier catalog:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // MÓDULO 3: Performance de fornecedores
  createSupplierPerformance = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const performanceData = { ...req.body, createdBy: userId };
      const performance = await this.repository.createSupplierPerformance(tenantId, performanceData);
      res.status(201).json(performance);
    } catch (error) {
      console.error('Error creating supplier performance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getSupplierPerformance = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const { supplierId } = req.query;
      const performance = await this.repository.findSupplierPerformance(tenantId, supplierId as string);
      res.json(performance);
    } catch (error) {
      console.error('Error getting supplier performance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // MÓDULO 4: Análise de demanda
  createDemandAnalysis = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const analysis = await this.repository.createDemandAnalysis(tenantId, req.body);
      res.status(201).json(analysis);
    } catch (error) {
      console.error('Error creating demand analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getDemandAnalysis = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const { partId } = req.query;
      const analysis = await this.repository.findDemandAnalysis(tenantId, partId as string);
      res.json(analysis);
    } catch (error) {
      console.error('Error getting demand analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // MÓDULO 4: Ordens de compra avançadas
  createPurchaseOrderAdvanced = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const orderData = { ...req.body, createdBy: userId };
      const order = await this.repository.createPurchaseOrderAdvanced(tenantId, orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPurchaseOrdersAdvanced = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const { status, supplierId } = req.query;
      const orders = await this.repository.findPurchaseOrdersAdvanced(tenantId, status as string, supplierId as string);
      res.json(orders);
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  approvePurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const { poId } = req.params;
      const order = await this.repository.approvePurchaseOrder(tenantId, poId, userId);
      res.json(order);
    } catch (error) {
      console.error('Error approving purchase order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // =====================================================
  // MÓDULOS 5-11: CONTROLLERS PARA SISTEMA COMPLETO
  // =====================================================

  // ===== MÓDULO 5: INTEGRAÇÃO COM SERVIÇOS =====
  createServiceIntegration = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const integration = await this.repository.createServiceIntegration(tenantId, req.body);
      res.status(201).json(integration);
    } catch (error) {
      console.error('Error creating service integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getServiceIntegrationsAdvanced = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const filters = {
        serviceType: req.query.serviceType as string,
        status: req.query.status as string
      };

      const integrations = await this.repository.findServiceIntegrationsAdvanced(tenantId, filters);
      res.json(integrations);
    } catch (error) {
      console.error('Error getting service integrations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createWorkOrderIntegration = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const integration = await this.repository.createWorkOrderIntegration(tenantId, req.body);
      res.status(201).json(integration);
    } catch (error) {
      console.error('Error creating work order integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 6: LOGÍSTICA E DISTRIBUIÇÃO =====
  createTransfer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const transferData = { ...req.body, createdBy: userId };
      const transfer = await this.repository.createTransfer(tenantId, transferData);
      res.status(201).json(transfer);
    } catch (error) {
      console.error('Error creating transfer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getTransfers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const filters = {
        status: req.query.status as string,
        transferType: req.query.transferType as string
      };

      const transfers = await this.repository.findTransfers(tenantId, filters);
      res.json(transfers);
    } catch (error) {
      console.error('Error getting transfers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createReturn = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const returnData = { ...req.body, createdBy: userId };
      const returnRecord = await this.repository.createReturn(tenantId, returnData);
      res.status(201).json(returnRecord);
    } catch (error) {
      console.error('Error creating return:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 7: CONTROLE DE ATIVOS =====
  createAssetComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const assetData = { ...req.body, createdBy: userId };
      const asset = await this.repository.createAssetComplete(tenantId, assetData);
      res.status(201).json(asset);
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createAssetMaintenance = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const maintenanceData = { ...req.body, createdBy: userId };
      const maintenance = await this.repository.createAssetMaintenance(tenantId, maintenanceData);
      res.status(201).json(maintenance);
    } catch (error) {
      console.error('Error creating asset maintenance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createAssetMovement = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const movementData = { ...req.body, createdBy: userId };
      const movement = await this.repository.createAssetMovement(tenantId, movementData);
      res.status(201).json(movement);
    } catch (error) {
      console.error('Error creating asset movement:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 8: LISTA DE PREÇOS UNITÁRIOS (LPU) =====
  createPriceListComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const priceListData = { ...req.body, createdBy: userId };
      const priceList = await this.repository.createPriceListComplete(tenantId, priceListData);
      res.status(201).json(priceList);
    } catch (error) {
      console.error('Error creating price list:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPriceListItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const item = await this.repository.createPriceListItem(tenantId, req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating price list item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 9: FUNCIONALIDADES AVANÇADAS DE PREÇO =====
  createPricingTable = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const pricingData = { ...req.body, createdBy: userId };
      const pricingTable = await this.repository.createPricingTable(tenantId, pricingData);
      res.status(201).json(pricingTable);
    } catch (error) {
      console.error('Error creating pricing table:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPricingRule = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const rule = await this.repository.createPricingRule(tenantId, req.body);
      res.status(201).json(rule);
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPriceHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const historyData = { ...req.body, changedBy: userId };
      const history = await this.repository.createPriceHistory(tenantId, historyData);
      res.status(201).json(history);
    } catch (error) {
      console.error('Error creating price history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 10: COMPLIANCE E AUDITORIA =====
  createAuditLogComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const auditData = {
        ...req.body,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const auditLog = await this.repository.createAuditLogComplete(tenantId, auditData);
      res.status(201).json(auditLog);
    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createCertification = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const certificationData = { ...req.body, createdBy: userId };
      const certification = await this.repository.createCertification(tenantId, certificationData);
      res.status(201).json(certification);
    } catch (error) {
      console.error('Error creating certification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createComplianceAlert = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const alertData = { ...req.body, createdBy: userId };
      const alert = await this.repository.createComplianceAlert(tenantId, alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error('Error creating compliance alert:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getComplianceAlerts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const filters = {
        status: req.query.status as string,
        severity: req.query.severity as string
      };

      const alerts = await this.repository.findComplianceAlerts(tenantId, filters);
      res.json(alerts);
    } catch (error) {
      console.error('Error getting compliance alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 11: DIFERENCIAIS AVANÇADOS =====
  createBudgetSimulation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const simulationData = { ...req.body, createdBy: userId };
      const simulation = await this.repository.createBudgetSimulation(tenantId, simulationData);
      res.status(201).json(simulation);
    } catch (error) {
      console.error('Error creating budget simulation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getBudgetSimulations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });
      
      const filters = {
        status: req.query.status as string,
        customerId: req.query.customerId as string
      };

      const simulations = await this.repository.findBudgetSimulations(tenantId, filters);
      res.json(simulations);
    } catch (error) {
      console.error('Error getting budget simulations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createDashboardConfig = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const configData = { ...req.body, userId: userId };
      const config = await this.repository.createDashboardConfig(tenantId, configData);
      res.status(201).json(config);
    } catch (error) {
      console.error('Error creating dashboard config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createIntegrationApi = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const apiData = { ...req.body, createdBy: userId };
      const api = await this.repository.createIntegrationApi(tenantId, apiData);
      res.status(201).json(api);
    } catch (error) {
      console.error('Error creating integration API:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createOfflineSync = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) return res.status(401).json({ error: 'Authentication required' });
      
      const syncData = { ...req.body, userId: userId };
      const sync = await this.repository.createOfflineSync(tenantId, syncData);
      res.status(201).json(sync);
    } catch (error) {
      console.error('Error creating offline sync:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}