import { Request, Response } from 'express';
import { tenantPartsServicesRepository } from './tenant-repository';
import { z } from 'zod';

// Validation schemas
const createItemSchema = z.object({
  active: z.boolean().default(true),
  type: z.enum(['material', 'service']),
  title: z.string().min(1, 'Nome é obrigatório'),
  integrationCode: z.string().optional(),
  description: z.string().optional(),
  measurementUnit: z.string().default('UN'),
  defaultMaintenancePlan: z.string().optional(),
  itemGroup: z.string().optional(),
  defaultChecklist: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  internalCode: z.string().min(1, 'Código interno é obrigatório'),
  manufacturerCode: z.string().optional(),
  supplierCode: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  specifications: z.any().optional(),
  technicalDetails: z.string().optional(),
  costPrice: z.number().optional(),
  salePrice: z.number().optional(),
  currency: z.string().default('BRL'),
  abcClassification: z.enum(['A', 'B', 'C']).optional(),
  criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.string().default('active'),
  tags: z.array(z.string()).optional(),
  customFields: z.any().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

const updateItemSchema = createItemSchema.partial();

export class PartsServicesController {

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboard(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const stats = await tenantPartsServicesRepository.getDashboardStats(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar estatísticas do dashboard',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // ============================================
  // ITEMS CRUD
  // ============================================

  async getItems(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const {
        search,
        category,
        type,
        status,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {
        search: search as string,
        category: category as string,
        type: type as string,
        status: status as string,
        limit: Number(limit),
        offset: Number(offset)
      };

      const items = await tenantPartsServicesRepository.getItems(tenantId, filters);

      res.json({
        success: true,
        data: items,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: items.length
        }
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar itens',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async createItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      console.log('CreateItem - Frontend Sending data:', req.body);

      // Validate input data
      const validatedData = createItemSchema.parse({
        ...req.body,
        createdBy: userId,
        updatedBy: userId
      });

      console.log('CreateItem - Validated data:', validatedData);

      const newItem = await tenantPartsServicesRepository.createItem(tenantId, validatedData);

      console.log('CreateItem - Created item:', newItem);

      res.status(201).json({
        success: true,
        data: newItem,
        message: 'Item criado com sucesso'
      });
    } catch (error) {
      console.error('Error creating item:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      res.status(500).json({ 
        error: 'Erro ao criar item',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      // Validate input data
      const validatedData = updateItemSchema.parse({
        ...req.body,
        updatedBy: userId
      });

      const updatedItem = await tenantPartsServicesRepository.updateItem(tenantId, id, validatedData);

      if (!updatedItem) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      res.json({
        success: true,
        data: updatedItem,
        message: 'Item atualizado com sucesso'
      });
    } catch (error) {
      console.error('Error updating item:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      res.status(500).json({ 
        error: 'Erro ao atualizar item',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async deleteItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const deleted = await tenantPartsServicesRepository.deleteItem(tenantId, id);

      if (!deleted) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      res.json({
        success: true,
        message: 'Item excluído com sucesso'
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ 
        error: 'Erro ao excluir item',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getItemById(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const item = await tenantPartsServicesRepository.getItemById(tenantId, id);

      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Error fetching item by ID:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar item',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async createItemLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;
      const { itemId } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const linkData = {
        ...req.body,
        sourceItemId: itemId,
        createdBy: userId,
        updatedBy: userId
      };

      const newLink = await tenantPartsServicesRepository.createItemLink(tenantId, linkData);

      res.status(201).json({
        success: true,
        data: newLink,
        message: 'Vínculo criado com sucesso'
      });
    } catch (error) {
      console.error('Error creating item link:', error);
      res.status(500).json({ 
        error: 'Erro ao criar vínculo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getItemLinks(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { itemId } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const links = await tenantPartsServicesRepository.getItemLinks(tenantId, itemId);

      res.json({
        success: true,
        data: links
      });
    } catch (error) {
      console.error('Error fetching item links:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar vínculos do item',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async deleteItemLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const deleted = await tenantPartsServicesRepository.deleteItemLink(tenantId, id);

      if (!deleted) {
        return res.status(404).json({ error: 'Vínculo não encontrado' });
      }

      res.json({
        success: true,
        message: 'Vínculo excluído com sucesso'
      });
    } catch (error) {
      console.error('Error deleting item link:', error);
      res.status(500).json({ 
        error: 'Erro ao excluir vínculo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async createStockLocation(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const locationData = {
        ...req.body,
        createdBy: userId,
        updatedBy: userId
      };

      const newLocation = await tenantPartsServicesRepository.createStockLocation(tenantId, locationData);

      res.status(201).json({
        success: true,
        data: newLocation,
        message: 'Localização criada com sucesso'
      });
    } catch (error) {
      console.error('Error creating stock location:', error);
      res.status(500).json({ 
        error: 'Erro ao criar localização',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getStockLocationById(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const location = await tenantPartsServicesRepository.getStockLocationById(tenantId, id);

      if (!location) {
        return res.status(404).json({ error: 'Localização não encontrada' });
      }

      res.json({
        success: true,
        data: location
      });
    } catch (error) {
      console.error('Error fetching stock location by ID:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar localização',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async updateStockLocation(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const locationData = {
        ...req.body,
        updatedBy: userId
      };

      const updatedLocation = await tenantPartsServicesRepository.updateStockLocation(tenantId, id, locationData);

      if (!updatedLocation) {
        return res.status(404).json({ error: 'Localização não encontrada' });
      }

      res.json({
        success: true,
        data: updatedLocation,
        message: 'Localização atualizada com sucesso'
      });
    } catch (error) {
      console.error('Error updating stock location:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar localização',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async updateStockLevel(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { itemId, locationId } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const updatedLevel = await tenantPartsServicesRepository.updateStockLevel(tenantId, itemId, locationId, req.body);

      res.json({
        success: true,
        data: updatedLevel,
        message: 'Nível de estoque atualizado com sucesso'
      });
    } catch (error) {
      console.error('Error updating stock level:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar nível de estoque',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async createStockMovement(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const movementData = {
        ...req.body,
        createdBy: userId
      };

      const newMovement = await tenantPartsServicesRepository.createStockMovement(tenantId, movementData);

      res.status(201).json({
        success: true,
        data: newMovement,
        message: 'Movimentação criada com sucesso'
      });
    } catch (error) {
      console.error('Error creating stock movement:', error);
      res.status(500).json({ 
        error: 'Erro ao criar movimentação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getStockMovements(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const {
        itemId,
        locationId,
        movementType,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {
        itemId: itemId as string,
        locationId: locationId as string,
        movementType: movementType as string,
        limit: Number(limit),
        offset: Number(offset)
      };

      const movements = await tenantPartsServicesRepository.getStockMovements(tenantId, filters);

      res.json({
        success: true,
        data: movements
      });
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar movimentações',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getSupplierById(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const supplier = await tenantPartsServicesRepository.getSupplierById(tenantId, id);

      if (!supplier) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      res.json({
        success: true,
        data: supplier
      });
    } catch (error) {
      console.error('Error fetching supplier by ID:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar fornecedor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const supplierData = {
        ...req.body,
        updated_by: userId
      };

      const updatedSupplier = await tenantPartsServicesRepository.updateSupplier(tenantId, id, supplierData);

      if (!updatedSupplier) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      res.json({
        success: true,
        data: updatedSupplier,
        message: 'Fornecedor atualizado com sucesso'
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar fornecedor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const deleted = await tenantPartsServicesRepository.deleteSupplier(tenantId, id);

      if (!deleted) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      res.json({
        success: true,
        message: 'Fornecedor excluído com sucesso'
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ 
        error: 'Erro ao excluir fornecedor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async createSupplierCatalogItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const catalogData = {
        ...req.body,
        updatedBy: userId
      };

      const newCatalogItem = await tenantPartsServicesRepository.createSupplierCatalogItem(tenantId, catalogData);

      res.status(201).json({
        success: true,
        data: newCatalogItem,
        message: 'Item do catálogo criado com sucesso'
      });
    } catch (error) {
      console.error('Error creating supplier catalog item:', error);
      res.status(500).json({ 
        error: 'Erro ao criar item do catálogo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getSupplierCatalog(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const {
        supplierId,
        itemId,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {
        supplierId: supplierId as string,
        itemId: itemId as string,
        limit: Number(limit),
        offset: Number(offset)
      };

      const catalog = await tenantPartsServicesRepository.getSupplierCatalog(tenantId, filters);

      res.json({
        success: true,
        data: catalog
      });
    } catch (error) {
      console.error('Error fetching supplier catalog:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar catálogo de fornecedores',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async updateSupplierCatalogItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const catalogData = {
        ...req.body,
        updatedBy: userId
      };

      const updatedItem = await tenantPartsServicesRepository.updateSupplierCatalogItem(tenantId, id, catalogData);

      if (!updatedItem) {
        return res.status(404).json({ error: 'Item do catálogo não encontrado' });
      }

      res.json({
        success: true,
        data: updatedItem,
        message: 'Item do catálogo atualizado com sucesso'
      });
    } catch (error) {
      console.error('Error updating supplier catalog item:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar item do catálogo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async deleteSupplierCatalogItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const deleted = await tenantPartsServicesRepository.deleteSupplierCatalogItem(tenantId, id);

      if (!deleted) {
        return res.status(404).json({ error: 'Item do catálogo não encontrado' });
      }

      res.json({
        success: true,
        message: 'Item do catálogo excluído com sucesso'
      });
    } catch (error) {
      console.error('Error deleting supplier catalog item:', error);
      res.status(500).json({ 
        error: 'Erro ao excluir item do catálogo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // ============================================
  // SUPPLIERS CRUD
  // ============================================

  async getSuppliers(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const {
        search,
        status,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {
        search: search as string,
        status: status as string,
        limit: Number(limit),
        offset: Number(offset)
      };

      const suppliers = await tenantPartsServicesRepository.getSuppliers(tenantId, filters);

      res.json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar fornecedores',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async createSupplier(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const supplierData = {
        ...req.body,
        created_by: userId,
        updated_by: userId
      };

      const newSupplier = await tenantPartsServicesRepository.createSupplier(tenantId, supplierData);

      res.status(201).json({
        success: true,
        data: newSupplier,
        message: 'Fornecedor criado com sucesso'
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ 
        error: 'Erro ao criar fornecedor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // ============================================
  // STOCK MANAGEMENT
  // ============================================

  async getStockLevels(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const {
        itemId,
        locationId,
        lowStock,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {
        itemId: itemId as string,
        locationId: locationId as string,
        lowStock: lowStock === 'true',
        limit: Number(limit),
        offset: Number(offset)
      };

      const stockLevels = await tenantPartsServicesRepository.getStockLevels(tenantId, filters);

      res.json({
        success: true,
        data: stockLevels
      });
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar níveis de estoque',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getStockLocations(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const {
        search,
        parentId,
        isActive,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {
        search: search as string,
        parentId: parentId as string,
        isActive: isActive ? isActive === 'true' : undefined,
        limit: Number(limit),
        offset: Number(offset)
      };

      const locations = await tenantPartsServicesRepository.getStockLocations(tenantId, filters);

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      console.error('Error fetching stock locations:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar localizações de estoque',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}

export const partsServicesController = new PartsServicesController();