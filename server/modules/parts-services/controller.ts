import { Request, Response } from "express";
import { PartsServicesRepository } from "./repository";
import { tenantPartsServicesRepository } from "./tenant-repository";
import { 
  insertItemSchema, 
  insertItemLinkSchema, 
  insertItemAttachmentSchema,
  insertStockLocationSchema,
  insertStockMovementSchema,
  insertSupplierSchema,
  insertSupplierCatalogSchema
} from "../../../shared/schema-parts-services";
import { z } from "zod";

export class PartsServicesController {
  private repository: PartsServicesRepository;

  constructor() {
    this.repository = new PartsServicesRepository();
  }

  // ============================================
  // ITEMS ENDPOINTS
  // ============================================
  
  async createItem(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const validatedData = insertItemSchema.parse(req.body);
      
      const item = await this.repository.createItem(tenantId, {
        ...validatedData,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Override with tenant repository method - original method moved later

  async getItemById(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      
      const item = await this.repository.getItemById(tenantId, id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const validatedData = insertItemSchema.partial().parse(req.body);
      
      const item = await this.repository.updateItem(tenantId, id, {
        ...validatedData,
        updatedBy: req.user.id
      });
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteItem(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      
      const deleted = await this.repository.deleteItem(tenantId, id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // ITEM LINKS ENDPOINTS
  // ============================================
  
  async createItemLink(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const validatedData = insertItemLinkSchema.parse(req.body);
      
      const link = await this.repository.createItemLink(tenantId, {
        ...validatedData,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating item link:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getItemLinks(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { itemId } = req.params;
      
      const links = await this.repository.getItemLinks(tenantId, itemId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching item links:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteItemLink(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      
      const deleted = await this.repository.deleteItemLink(tenantId, id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Item link not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item link:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // STOCK LOCATIONS ENDPOINTS
  // ============================================
  
  async createStockLocation(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const validatedData = insertStockLocationSchema.parse(req.body);
      
      const location = await this.repository.createStockLocation(tenantId, {
        ...validatedData,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating stock location:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getStockLocations(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const locations = await this.repository.getStockLocations(tenantId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching stock locations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getStockLocationById(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      
      const location = await this.repository.getStockLocationById(tenantId, id);
      
      if (!location) {
        return res.status(404).json({ message: "Stock location not found" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Error fetching stock location:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateStockLocation(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const validatedData = insertStockLocationSchema.partial().parse(req.body);
      
      const location = await this.repository.updateStockLocation(tenantId, id, {
        ...validatedData,
        updatedBy: req.user.id
      });
      
      if (!location) {
        return res.status(404).json({ message: "Stock location not found" });
      }
      
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating stock location:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // STOCK LEVELS ENDPOINTS
  // ============================================
  
  async getStockLevels(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        itemId: req.query.itemId as string,
        locationId: req.query.locationId as string,
        lowStock: req.query.lowStock === 'true'
      };
      
      const stockLevels = await this.repository.getStockLevels(tenantId, filters);
      res.json(stockLevels);
    } catch (error) {
      console.error("Error fetching stock levels:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateStockLevel(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { itemId, locationId } = req.params;
      const { currentStock, minimumStock, maximumStock, reorderPoint, reorderQuantity } = req.body;
      
      const stockLevel = await this.repository.updateStockLevel(tenantId, itemId, locationId, {
        currentStock: currentStock?.toString(),
        minimumStock: minimumStock?.toString(),
        maximumStock: maximumStock?.toString(),
        reorderPoint: reorderPoint?.toString(),
        reorderQuantity: reorderQuantity?.toString()
      });
      
      res.json(stockLevel);
    } catch (error) {
      console.error("Error updating stock level:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // STOCK MOVEMENTS ENDPOINTS
  // ============================================
  
  async createStockMovement(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const validatedData = insertStockMovementSchema.parse(req.body);
      
      const movement = await this.repository.createStockMovement(tenantId, {
        ...validatedData,
        createdBy: req.user.id
      });
      
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating stock movement:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getStockMovements(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        itemId: req.query.itemId as string,
        locationId: req.query.locationId as string,
        movementType: req.query.movementType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      const result = await this.repository.getStockMovements(tenantId, filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // SUPPLIERS ENDPOINTS
  // ============================================
  
  async createSupplier(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const validatedData = insertSupplierSchema.parse(req.body);
      
      const supplier = await this.repository.createSupplier(tenantId, {
        ...validatedData,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getSuppliers(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        category: req.query.category as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      const result = await this.repository.getSuppliers(tenantId, filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getSupplierById(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      
      const supplier = await this.repository.getSupplierById(tenantId, id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      
      const supplier = await this.repository.updateSupplier(tenantId, id, {
        ...validatedData,
        updatedBy: req.user.id
      });
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      
      const deleted = await this.repository.deleteSupplier(tenantId, id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // SUPPLIER CATALOG ENDPOINTS
  // ============================================
  
  async createSupplierCatalogItem(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const validatedData = insertSupplierCatalogSchema.parse(req.body);
      
      const catalogItem = await this.repository.createSupplierCatalogItem(tenantId, {
        ...validatedData,
        updatedBy: req.user.id
      });
      
      res.status(201).json(catalogItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating supplier catalog item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getSupplierCatalog(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const supplierId = req.query.supplierId as string;
      const itemId = req.query.itemId as string;
      
      const catalog = await this.repository.getSupplierCatalog(tenantId, supplierId, itemId);
      res.json(catalog);
    } catch (error) {
      console.error("Error fetching supplier catalog:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateSupplierCatalogItem(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const validatedData = insertSupplierCatalogSchema.partial().parse(req.body);
      
      const catalogItem = await this.repository.updateSupplierCatalogItem(tenantId, id, {
        ...validatedData,
        updatedBy: req.user.id
      });
      
      if (!catalogItem) {
        return res.status(404).json({ message: "Supplier catalog item not found" });
      }
      
      res.json(catalogItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating supplier catalog item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteSupplierCatalogItem(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      
      const deleted = await this.repository.deleteSupplierCatalogItem(tenantId, id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Supplier catalog item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier catalog item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================
  
  async getDashboardStats(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const stats = await tenantPartsServicesRepository.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getItems(req: Request, res: Response) {
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

  async getSuppliers(req: Request, res: Response) {
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

  async getStockLevels(req: Request, res: Response) {
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

  async getStockLocations(req: Request, res: Response) {
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