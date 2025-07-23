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

  constructor() {
    this.repository = new DirectPartsServicesRepository();
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
}