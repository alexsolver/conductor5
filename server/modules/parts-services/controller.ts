import { Request, Response } from 'express';
import { PartsServicesRepository } from './repository';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class PartsServicesController {
  private repository = new PartsServicesRepository();

  // ============================================
  // ITEMS ENDPOINTS - CRUD COMPLETO
  // ============================================

  createItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { name, type, description, integrationCode, measurementUnit, maintenancePlan, group, defaultChecklist } = req.body;

      // Validações obrigatórias
      if (!name || !type) {
        return res.status(400).json({ 
          message: "Nome e tipo são campos obrigatórios" 
        });
      }

      if (!['material', 'service'].includes(type)) {
        return res.status(400).json({ 
          message: "Tipo deve ser 'material' ou 'service'" 
        });
      }

      const item = await this.repository.createItem(tenantId, {
        name,
        type,
        description,
        integrationCode,
        measurementUnit: measurementUnit || 'UN',
        maintenancePlan,
        group,
        defaultChecklist,
        active: true,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });

      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        search: req.query.search as string,
        type: req.query.type as string,
        active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      const result = await this.repository.getItems(tenantId, filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getItemById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const item = await this.repository.getItemById(tenantId, id);
      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  updateItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      // Validação de tipo se fornecido
      if (updateData.type && !['material', 'service'].includes(updateData.type)) {
        return res.status(400).json({ 
          message: "Tipo deve ser 'material' ou 'service'" 
        });
      }

      const item = await this.repository.updateItem(tenantId, id, updateData);
      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const success = await this.repository.deleteItem(tenantId, id);
      if (!success) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // ============================================
  // SUPPLIERS ENDPOINTS - CRUD COMPLETO
  // ============================================

  createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { name, supplierCode, documentNumber, email, phone } = req.body;

      if (!name) {
        return res.status(400).json({ 
          message: "Nome é campo obrigatório" 
        });
      }

      const supplier = await this.repository.createSupplier(tenantId, {
        name,
        supplierCode,
        documentNumber,
        email,
        phone,
        status: 'active'
      });

      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      const result = await this.repository.getSuppliers(tenantId, filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const supplier = await this.repository.getSupplierById(tenantId, id);
      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }

      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const updateData = req.body;

      const supplier = await this.repository.updateSupplier(tenantId, id, updateData);
      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }

      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const success = await this.repository.deleteSupplier(tenantId, id);
      if (!success) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // ============================================
  // STOCK LOCATIONS - CRUD COMPLETO
  // ============================================

  createStockLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const { name, code, description, address } = req.body;

      if (!name) {
        return res.status(400).json({ 
          message: "Nome é campo obrigatório" 
        });
      }

      const location = await this.repository.createStockLocation(tenantId, {
        name,
        code,
        description,
        address,
        coordinates: {},
        isActive: true
      });

      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating stock location:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getStockLocations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const locations = await this.repository.getStockLocations(tenantId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching stock locations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // ============================================
  // DASHBOARD
  // ============================================

  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      const stats = await this.repository.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}