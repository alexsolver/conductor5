import { Request, Response } from 'express';
import { PartsServicesRepository } from '../repositories/PartsServicesRepository';
import { 
  insertItemSchema,
  insertItemAttachmentSchema,
  insertItemLinkSchema,
  insertItemCustomerLinkSchema,
  insertItemSupplierLinkSchema,
  insertStockLocationSchema,
  insertStockLevelSchema,
  insertStockMovementSchema,
  insertSupplierSchema,
  insertServiceKitSchema,
  insertServiceKitItemSchema,
  insertPriceListSchema,
  insertPriceListItemSchema,
  insertAuditLogSchema,
  insertQualityCertificationSchema
} from '@shared/schema';
import { z } from 'zod';

export class PartsServicesController {
  private repository: PartsServicesRepository;

  constructor() {
    this.repository = new PartsServicesRepository();
  }

  // ========================================
  // ITEMS ENDPOINTS
  // ========================================
  
  getItems = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const { search, type, group, isActive } = req.query;
      const filters = {
        search: search as string,
        type: type as 'material' | 'service',
        group: group as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      };

      const items = await this.repository.getItems(tenantId, filters);
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Failed to fetch items' });
    }
  };

  createItem = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const validatedData = insertItemSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId,
        updatedById: userId
      });

      const item = await this.repository.createItem(validatedData);
      
      // Create audit log
      await this.repository.createAuditLog({
        tenantId,
        tableName: 'items',
        recordId: item.id,
        operation: 'create',
        newValues: item,
        changedFields: Object.keys(validatedData),
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating item:', error);
      res.status(500).json({ message: 'Failed to create item' });
    }
  };

  updateItem = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const updateData = { ...req.body, updatedById: userId };
      const item = await this.repository.updateItem(id, tenantId, updateData);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      // Create audit log
      await this.repository.createAuditLog({
        tenantId,
        tableName: 'items',
        recordId: item.id,
        operation: 'update',
        newValues: item,
        changedFields: Object.keys(updateData),
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(item);
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ message: 'Failed to update item' });
    }
  };

  deleteItem = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const success = await this.repository.deleteItem(id, tenantId);
      
      if (!success) {
        return res.status(404).json({ message: 'Item not found' });
      }

      // Create audit log
      await this.repository.createAuditLog({
        tenantId,
        tableName: 'items',
        recordId: id,
        operation: 'delete',
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Failed to delete item' });
    }
  };

  // ========================================
  // STOCK CONTROL ENDPOINTS
  // ========================================
  
  getStockLocations = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const locations = await this.repository.getStockLocations(tenantId);
      res.json(locations);
    } catch (error) {
      console.error('Error fetching stock locations:', error);
      res.status(500).json({ message: 'Failed to fetch stock locations' });
    }
  };

  createStockLocation = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const validatedData = insertStockLocationSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId
      });

      const location = await this.repository.createStockLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating stock location:', error);
      res.status(500).json({ message: 'Failed to create stock location' });
    }
  };

  getStockLevels = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const { itemId, locationId } = req.query;
      const levels = await this.repository.getStockLevels(
        tenantId, 
        itemId as string, 
        locationId as string
      );
      res.json(levels);
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      res.status(500).json({ message: 'Failed to fetch stock levels' });
    }
  };

  createStockLevel = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const validatedData = insertStockLevelSchema.parse({
        ...req.body,
        tenantId
      });

      const level = await this.repository.createStockLevel(validatedData);
      res.status(201).json(level);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating stock level:', error);
      res.status(500).json({ message: 'Failed to create stock level' });
    }
  };

  getStockMovements = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const { itemId, locationId, type, dateFrom, dateTo } = req.query;
      const filters = {
        itemId: itemId as string,
        locationId: locationId as string,
        type: type as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      const movements = await this.repository.getStockMovements(tenantId, filters);
      res.json(movements);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ message: 'Failed to fetch stock movements' });
    }
  };

  createStockMovement = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const validatedData = insertStockMovementSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId
      });

      const movement = await this.repository.createStockMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating stock movement:', error);
      res.status(500).json({ message: 'Failed to create stock movement' });
    }
  };

  // ========================================
  // SUPPLIERS ENDPOINTS
  // ========================================
  
  getSuppliers = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const { search, category, isActive, isApproved } = req.query;
      const filters = {
        search: search as string,
        category: category as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isApproved: isApproved === 'true' ? true : isApproved === 'false' ? false : undefined
      };

      const suppliers = await this.repository.getSuppliers(tenantId, filters);
      res.json(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ message: 'Failed to fetch suppliers' });
    }
  };

  createSupplier = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const validatedData = insertSupplierSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId,
        updatedById: userId
      });

      const supplier = await this.repository.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating supplier:', error);
      res.status(500).json({ message: 'Failed to create supplier' });
    }
  };

  updateSupplier = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const updateData = { ...req.body, updatedById: userId };
      const supplier = await this.repository.updateSupplier(id, tenantId, updateData);
      
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      res.json(supplier);
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ message: 'Failed to update supplier' });
    }
  };

  deleteSupplier = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const success = await this.repository.deleteSupplier(id, tenantId);
      
      if (!success) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ message: 'Failed to delete supplier' });
    }
  };

  // ========================================
  // SERVICE INTEGRATION ENDPOINTS
  // ========================================
  
  getServiceKits = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const { search, type, isActive } = req.query;
      const filters = {
        search: search as string,
        type: type as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      };

      const serviceKits = await this.repository.getServiceKits(tenantId, filters);
      res.json(serviceKits);
    } catch (error) {
      console.error('Error fetching service kits:', error);
      res.status(500).json({ message: 'Failed to fetch service kits' });
    }
  };

  createServiceKit = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const validatedData = insertServiceKitSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId,
        updatedById: userId
      });

      const serviceKit = await this.repository.createServiceKit(validatedData);
      res.status(201).json(serviceKit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating service kit:', error);
      res.status(500).json({ message: 'Failed to create service kit' });
    }
  };

  // ========================================
  // PRICE LISTS ENDPOINTS (LPU)
  // ========================================
  
  getPriceLists = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const { search, status, customerCompanyId } = req.query;
      const filters = {
        search: search as string,
        status: status as string,
        customerCompanyId: customerCompanyId as string
      };

      const priceLists = await this.repository.getPriceLists(tenantId, filters);
      res.json(priceLists);
    } catch (error) {
      console.error('Error fetching price lists:', error);
      res.status(500).json({ message: 'Failed to fetch price lists' });
    }
  };

  createPriceList = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const validatedData = insertPriceListSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId,
        updatedById: userId
      });

      const priceList = await this.repository.createPriceList(validatedData);
      res.status(201).json(priceList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating price list:', error);
      res.status(500).json({ message: 'Failed to create price list' });
    }
  };

  // ========================================
  // QUALITY CERTIFICATIONS ENDPOINTS
  // ========================================
  
  getQualityCertifications = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const { search, type, status } = req.query;
      const filters = {
        search: search as string,
        type: type as string,
        status: status as string
      };

      const certifications = await this.repository.getQualityCertifications(tenantId, filters);
      res.json(certifications);
    } catch (error) {
      console.error('Error fetching quality certifications:', error);
      res.status(500).json({ message: 'Failed to fetch quality certifications' });
    }
  };

  createQualityCertification = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const validatedData = insertQualityCertificationSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId
      });

      const certification = await this.repository.createQualityCertification(validatedData);
      res.status(201).json(certification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating quality certification:', error);
      res.status(500).json({ message: 'Failed to create quality certification' });
    }
  };

  // ========================================
  // DASHBOARD ENDPOINTS
  // ========================================
  
  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant ID not found' });
      }

      const stats = await this.repository.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  };
}