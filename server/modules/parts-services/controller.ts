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