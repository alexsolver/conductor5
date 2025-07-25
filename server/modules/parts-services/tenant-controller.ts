import { Request, Response } from "express";
import { tenantPartsServicesRepository } from "./tenant-repository";

// Define the User interface for JWT middleware
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class TenantPartsServicesController {
  
  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================
  
  async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const stats = await tenantPartsServicesRepository.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // ITEMS ENDPOINTS
  // ============================================

  async getItems(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        type: req.query.type as string,
        status: req.query.status as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };
      
      const items = await tenantPartsServicesRepository.getItems(tenantId, filters);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async createItem(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const data = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id
      };
      
      const item = await tenantPartsServicesRepository.createItem(tenantId, data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // SUPPLIERS ENDPOINTS
  // ============================================

  async getSuppliers(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };
      
      const suppliers = await tenantPartsServicesRepository.getSuppliers(tenantId, filters);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async createSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const data = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id
      };
      
      const supplier = await tenantPartsServicesRepository.createSupplier(tenantId, data);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // STOCK ENDPOINTS
  // ============================================

  async getStockLevels(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        itemId: req.query.itemId as string,
        locationId: req.query.locationId as string,
        lowStock: req.query.lowStock === 'true',
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };
      
      const stockLevels = await tenantPartsServicesRepository.getStockLevels(tenantId, filters);
      res.json(stockLevels);
    } catch (error) {
      console.error("Error fetching stock levels:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getStockLocations(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        search: req.query.search as string,
        parentId: req.query.parentId as string,
        isActive: req.query.isActive === 'true',
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };
      
      const locations = await tenantPartsServicesRepository.getStockLocations(tenantId, filters);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching stock locations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export const tenantPartsServicesController = new TenantPartsServicesController();