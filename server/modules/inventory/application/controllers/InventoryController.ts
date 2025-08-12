/**
 * Inventory Controller - Phase 11 Implementation
 * 
 * Controlador para operações de inventário
 * Camada de aplicação seguindo Clean Architecture
 * 
 * @module InventoryController
 * @version 1.0.0
 * @created 2025-08-12 - Phase 11 Clean Architecture Implementation
 */

import type { Request, Response } from 'express';
import type { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { InventoryItem, InventoryItemEntity } from '../../domain/entities/InventoryItem';
// AuthenticatedRequest type definition
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}
import { z } from 'zod';

// Validation schemas
const createInventoryItemSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório').max(100, 'SKU deve ter no máximo 100 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome deve ter no máximo 255 caracteres'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória').max(100, 'Categoria deve ter no máximo 100 caracteres'),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  unitOfMeasure: z.enum(['unit', 'kg', 'liter', 'meter', 'box', 'pack']).default('unit'),
  currentStock: z.number().min(0, 'Estoque atual não pode ser negativo').default(0),
  minimumStock: z.number().min(0, 'Estoque mínimo não pode ser negativo').default(0),
  maximumStock: z.number().min(0, 'Estoque máximo não pode ser negativo').optional(),
  unitCost: z.number().min(0, 'Custo unitário não pode ser negativo').default(0),
  averageCost: z.number().min(0, 'Custo médio não pode ser negativo').optional(),
  supplier: z.string().optional(),
  supplierCode: z.string().optional(),
  location: z.string().min(1, 'Localização é obrigatória').default('default'),
  shelf: z.string().optional(),
  expirationDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  batchNumber: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  customFields: z.record(z.any()).optional()
});

const updateInventoryItemSchema = createInventoryItemSchema.partial();

const stockAdjustmentSchema = z.object({
  adjustment: z.number().refine(val => val !== 0, 'Ajuste deve ser diferente de zero'),
  reason: z.string().min(1, 'Motivo é obrigatório')
});

export class InventoryController {
  constructor(private inventoryRepository: IInventoryRepository) {}

  /**
   * Create inventory item
   * POST /api/inventory-integration/working/items
   */
  async createItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      // Validate input
      const itemData = createInventoryItemSchema.parse(req.body);

      // Check if SKU already exists
      const skuExists = await this.inventoryRepository.existsBySku(itemData.sku, tenantId);
      if (skuExists) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Um item com este SKU já existe'
        });
        return;
      }

      // Create inventory item entity
      const itemEntity = InventoryItemEntity.create({
        tenantId,
        ...itemData,
        averageCost: itemData.averageCost || itemData.unitCost,
        createdBy: req.user?.id
      });

      // Convert to InventoryItem interface
      const item: InventoryItem = {
        id: itemEntity.id,
        tenantId: itemEntity.tenantId,
        sku: itemEntity.sku,
        name: itemEntity.name,
        description: itemEntity.description || undefined,
        category: itemEntity.category,
        subcategory: itemEntity.subcategory || undefined,
        brand: itemEntity.brand || undefined,
        model: itemEntity.model || undefined,
        unitOfMeasure: itemEntity.unitOfMeasure,
        currentStock: itemEntity.currentStock,
        minimumStock: itemEntity.minimumStock,
        maximumStock: itemEntity.maximumStock || undefined,
        unitCost: itemEntity.unitCost,
        averageCost: itemEntity.averageCost,
        lastPurchasePrice: itemEntity.lastPurchasePrice || undefined,
        supplier: itemEntity.supplier || undefined,
        supplierCode: itemEntity.supplierCode || undefined,
        location: itemEntity.location,
        shelf: itemEntity.shelf || undefined,
        serialNumbers: itemEntity.serialNumbers,
        expirationDate: itemEntity.expirationDate || undefined,
        batchNumber: itemEntity.batchNumber || undefined,
        status: itemEntity.status,
        tags: itemEntity.tags,
        customFields: itemEntity.customFields || undefined,
        isActive: itemEntity.isActive,
        createdAt: itemEntity.createdAt,
        updatedAt: itemEntity.updatedAt,
        createdBy: itemEntity.createdBy || undefined,
        updatedBy: itemEntity.updatedBy || undefined
      };

      // Save to repository
      const createdItem = await this.inventoryRepository.create(item);

      res.status(201).json({
        success: true,
        data: createdItem,
        message: 'Item de inventário criado com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[INVENTORY-CONTROLLER] Error creating item:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao criar item de inventário'
      });
    }
  }

  /**
   * Get inventory items
   * GET /api/inventory-integration/working/items
   */
  async getItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { 
        category, 
        subcategory, 
        brand, 
        supplier, 
        location, 
        status, 
        search, 
        isActive,
        isLowStock,
        isExpired 
      } = req.query;

      const filters = {
        tenantId,
        ...(category && { category: category as string }),
        ...(subcategory && { subcategory: subcategory as string }),
        ...(brand && { brand: brand as string }),
        ...(supplier && { supplier: supplier as string }),
        ...(location && { location: location as string }),
        ...(status && { status: status as string }),
        ...(search && { search: search as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(isLowStock !== undefined && { isLowStock: isLowStock === 'true' }),
        ...(isExpired !== undefined && { isExpired: isExpired === 'true' })
      };

      const items = await this.inventoryRepository.findAll(filters);

      res.json({
        success: true,
        data: items,
        pagination: {
          page: 1,
          limit: 100,
          total: items.length,
          totalPages: 1
        },
        message: 'Itens de inventário recuperados com sucesso'
      });

    } catch (error) {
      console.error('[INVENTORY-CONTROLLER] Error fetching items:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar itens de inventário'
      });
    }
  }

  /**
   * Get inventory item by ID
   * GET /api/inventory-integration/working/items/:id
   */
  async getItemById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      const item = await this.inventoryRepository.findById(id, tenantId);
      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item de inventário não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: item,
        message: 'Item encontrado com sucesso'
      });

    } catch (error) {
      console.error('[INVENTORY-CONTROLLER] Error fetching item:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar item de inventário'
      });
    }
  }

  /**
   * Update inventory item
   * PUT /api/inventory-integration/working/items/:id
   */
  async updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      // Validate input
      const updateData = updateInventoryItemSchema.parse(req.body);

      // Check if item exists
      const existingItem = await this.inventoryRepository.findById(id, tenantId);
      if (!existingItem) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item de inventário não encontrado'
        });
        return;
      }

      // Check if new SKU conflicts (if SKU is being updated)
      if (updateData.sku && updateData.sku !== existingItem.sku) {
        const skuExists = await this.inventoryRepository.existsBySku(updateData.sku, tenantId, id);
        if (skuExists) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: 'Um item com este SKU já existe'
          });
          return;
        }
      }

      // Update item
      const updatedItem = await this.inventoryRepository.update(id, tenantId, {
        ...updateData,
        updatedBy: req.user?.id,
        updatedAt: new Date()
      });

      if (!updatedItem) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item de inventário não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedItem,
        message: 'Item de inventário atualizado com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[INVENTORY-CONTROLLER] Error updating item:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao atualizar item de inventário'
      });
    }
  }

  /**
   * Delete inventory item
   * DELETE /api/inventory-integration/working/items/:id
   */
  async deleteItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      const deleted = await this.inventoryRepository.delete(id, tenantId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item de inventário não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Item de inventário desativado com sucesso'
      });

    } catch (error) {
      console.error('[INVENTORY-CONTROLLER] Error deleting item:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao desativar item de inventário'
      });
    }
  }

  /**
   * Adjust stock
   * POST /api/inventory-integration/working/items/:id/adjust-stock
   */
  async adjustStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;
      const adjustmentData = stockAdjustmentSchema.parse(req.body);

      const updatedItem = await this.inventoryRepository.adjustStock(
        id, 
        tenantId, 
        adjustmentData.adjustment, 
        adjustmentData.reason, 
        req.user?.id
      );

      if (!updatedItem) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item de inventário não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedItem,
        message: 'Estoque ajustado com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[INVENTORY-CONTROLLER] Error adjusting stock:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao ajustar estoque'
      });
    }
  }

  /**
   * Get inventory statistics
   * GET /api/inventory-integration/working/statistics
   */
  async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const statistics = await this.inventoryRepository.getStatistics(tenantId);

      res.json({
        success: true,
        data: statistics,
        message: 'Estatísticas recuperadas com sucesso'
      });

    } catch (error) {
      console.error('[INVENTORY-CONTROLLER] Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Get low stock items
   * GET /api/inventory-integration/working/low-stock
   */
  async getLowStockItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const lowStockItems = await this.inventoryRepository.findLowStockItems(tenantId);

      res.json({
        success: true,
        data: lowStockItems,
        count: lowStockItems.length,
        message: 'Itens com baixo estoque recuperados com sucesso'
      });

    } catch (error) {
      console.error('[INVENTORY-CONTROLLER] Error fetching low stock items:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar itens com baixo estoque'
      });
    }
  }
}