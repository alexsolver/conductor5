/**
 * MaterialService Controller - Phase 14 Implementation
 * 
 * Controlador para operações de materiais e serviços
 * Camada de aplicação seguindo Clean Architecture
 * 
 * @module MaterialServiceController
 * @version 1.0.0
 * @created 2025-08-12 - Phase 14 Clean Architecture Implementation
 */

import type { Request, Response } from 'express';
import type { IMaterialServiceRepository } from '../../domain/repositories/IMaterialServiceRepository';
import { MaterialService, MaterialServiceEntity } from '../../domain/entities/MaterialService';

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
const createMaterialServiceSchema = z.object({
  type: z.enum(['material', 'service'], {
    errorMap: () => ({ message: 'Tipo deve ser "material" ou "service"' })
  }),
  category: z.string().min(1, 'Categoria é obrigatória').max(100, 'Categoria deve ter no máximo 100 caracteres'),
  subcategory: z.string().max(100, 'Subcategoria deve ter no máximo 100 caracteres').optional(),
  code: z.string().min(1, 'Código é obrigatório').max(50, 'Código deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Código deve conter apenas letras, números, hífens e underscores'),
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  unit: z.string().min(1, 'Unidade é obrigatória').max(20, 'Unidade deve ter no máximo 20 caracteres'),
  unitPrice: z.number().min(0, 'Preço unitário não pode ser negativo').max(999999999.99, 'Preço muito alto'),
  currency: z.string().default('BRL'),
  supplier: z.string().max(100, 'Fornecedor deve ter no máximo 100 caracteres').optional(),
  supplierId: z.string().optional(),
  brand: z.string().max(100, 'Marca deve ter no máximo 100 caracteres').optional(),
  model: z.string().max(100, 'Modelo deve ter no máximo 100 caracteres').optional(),
  specifications: z.record(z.any()).optional(),
  stockQuantity: z.number().min(0, 'Quantidade em estoque não pode ser negativa').optional(),
  minimumStock: z.number().min(0, 'Estoque mínimo não pode ser negativo').optional(),
  maximumStock: z.number().min(0, 'Estoque máximo não pode ser negativo').optional(),
  location: z.string().max(100, 'Localização deve ter no máximo 100 caracteres').optional(),
  barcode: z.string().max(50, 'Código de barras deve ter no máximo 50 caracteres').optional(),
  serialNumbers: z.array(z.string().max(50, 'Número de série deve ter no máximo 50 caracteres')).default([]),
  expirationDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().max(2000, 'Observações devem ter no máximo 2000 caracteres').optional(),
  tags: z.array(z.string().max(50, 'Tag deve ter no máximo 50 caracteres')).default([]),
  isStockControlled: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

const updateMaterialServiceSchema = createMaterialServiceSchema.partial().omit({ type: true });

const searchMaterialServiceSchema = z.object({
  query: z.string().min(1, 'Query de busca é obrigatória').max(100, 'Query deve ter no máximo 100 caracteres'),
  type: z.enum(['material', 'service']).optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  brand: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional()
});

const stockUpdateSchema = z.object({
  quantity: z.number().min(0, 'Quantidade não pode ser negativa'),
  reason: z.string().min(1, 'Motivo é obrigatório').max(200, 'Motivo deve ter no máximo 200 caracteres')
});

const priceUpdateSchema = z.object({
  price: z.number().min(0, 'Preço não pode ser negativo').max(999999999.99, 'Preço muito alto'),
  reason: z.string().max(200, 'Motivo deve ter no máximo 200 caracteres').optional()
});

const tagOperationSchema = z.object({
  tag: z.string().min(1, 'Tag é obrigatória').max(50, 'Tag deve ter no máximo 50 caracteres')
});

export class MaterialServiceController {
  constructor(private materialServiceRepository: IMaterialServiceRepository) {}

  /**
   * Create material/service
   * POST /api/materials-services-integration/working/materials-services
   */
  async createMaterialService(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const materialServiceData = createMaterialServiceSchema.parse(req.body);

      // Additional business validation
      if (materialServiceData.type === 'service') {
        if (materialServiceData.stockQuantity !== undefined || 
            materialServiceData.minimumStock !== undefined || 
            materialServiceData.maximumStock !== undefined) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Serviços não devem ter controle de estoque'
          });
          return;
        }
        if (materialServiceData.expirationDate) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Serviços não podem ter data de expiração'
          });
          return;
        }
      }

      // Check for duplicate code
      const existingByCode = await this.materialServiceRepository.existsByCode(materialServiceData.code, tenantId);
      if (existingByCode) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: `Código '${materialServiceData.code}' já está em uso`
        });
        return;
      }

      // Check for duplicate barcode
      if (materialServiceData.barcode) {
        const existingByBarcode = await this.materialServiceRepository.existsByBarcode(materialServiceData.barcode, tenantId);
        if (existingByBarcode) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `Código de barras '${materialServiceData.barcode}' já está em uso`
          });
          return;
        }
      }

      // Create material/service entity
      const materialServiceEntity = MaterialServiceEntity.create({
        tenantId,
        ...materialServiceData,
        createdBy: req.user?.id
      });

      // Convert to MaterialService interface
      const materialService: MaterialService = {
        id: materialServiceEntity.id,
        tenantId: materialServiceEntity.tenantId,
        type: materialServiceEntity.type,
        category: materialServiceEntity.category,
        subcategory: materialServiceEntity.subcategory || undefined,
        code: materialServiceEntity.code,
        name: materialServiceEntity.name,
        description: materialServiceEntity.description || undefined,
        unit: materialServiceEntity.unit,
        unitPrice: materialServiceEntity.unitPrice,
        currency: materialServiceEntity.currency,
        supplier: materialServiceEntity.supplier || undefined,
        supplierId: materialServiceEntity.supplierId || undefined,
        brand: materialServiceEntity.brand || undefined,
        model: materialServiceEntity.model || undefined,
        specifications: materialServiceEntity.specifications || undefined,
        stockQuantity: materialServiceEntity.stockQuantity || undefined,
        minimumStock: materialServiceEntity.minimumStock || undefined,
        maximumStock: materialServiceEntity.maximumStock || undefined,
        averageCost: materialServiceEntity.averageCost || undefined,
        lastPurchasePrice: materialServiceEntity.lastPurchasePrice || undefined,
        lastPurchaseDate: materialServiceEntity.lastPurchaseDate || undefined,
        location: materialServiceEntity.location || undefined,
        barcode: materialServiceEntity.barcode || undefined,
        serialNumbers: materialServiceEntity.serialNumbers,
        expirationDate: materialServiceEntity.expirationDate || undefined,
        notes: materialServiceEntity.notes || undefined,
        tags: materialServiceEntity.tags,
        isActive: materialServiceEntity.isActive,
        isStockControlled: materialServiceEntity.isStockControlled,
        isService: materialServiceEntity.isService,
        metadata: materialServiceEntity.metadata || undefined,
        createdAt: materialServiceEntity.createdAt,
        updatedAt: materialServiceEntity.updatedAt,
        createdBy: materialServiceEntity.createdBy || undefined,
        updatedBy: materialServiceEntity.updatedBy || undefined
      };

      // Save to repository
      const createdMaterialService = await this.materialServiceRepository.create(materialService);

      res.status(201).json({
        success: true,
        data: createdMaterialService,
        message: `${materialService.type === 'material' ? 'Material' : 'Serviço'} criado com sucesso`
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

      console.error('[MATERIALSERVICE-CONTROLLER] Error creating material/service:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao criar item'
      });
    }
  }

  /**
   * Get materials/services
   * GET /api/materials-services-integration/working/materials-services
   */
  async getMaterialsServices(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { type, category, subcategory, supplier, brand, location, isActive, search, tags, stockStatus, expirationStatus } = req.query;

      const filters = {
        tenantId,
        ...(type && { type: type as 'material' | 'service' }),
        ...(category && { category: category as string }),
        ...(subcategory && { subcategory: subcategory as string }),
        ...(supplier && { supplier: supplier as string }),
        ...(brand && { brand: brand as string }),
        ...(location && { location: location as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(search && { search: search as string }),
        ...(tags && { tags: Array.isArray(tags) ? tags as string[] : [tags as string] }),
        ...(stockStatus && { stockStatus: stockStatus as any }),
        ...(expirationStatus && { expirationStatus: expirationStatus as any })
      };

      const materialsServices = await this.materialServiceRepository.findAll(filters);

      res.json({
        success: true,
        data: materialsServices,
        pagination: {
          page: 1,
          limit: 100,
          total: materialsServices.length,
          totalPages: 1
        },
        message: 'Itens recuperados com sucesso'
      });

    } catch (error) {
      console.error('[MATERIALSERVICE-CONTROLLER] Error fetching materials/services:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar itens'
      });
    }
  }

  /**
   * Get material/service by ID
   * GET /api/materials-services-integration/working/materials-services/:id
   */
  async getMaterialServiceById(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const materialService = await this.materialServiceRepository.findById(id, tenantId);
      if (!materialService) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: materialService,
        message: 'Item encontrado com sucesso'
      });

    } catch (error) {
      console.error('[MATERIALSERVICE-CONTROLLER] Error fetching material/service:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar item'
      });
    }
  }

  /**
   * Update material/service
   * PUT /api/materials-services-integration/working/materials-services/:id
   */
  async updateMaterialService(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const updateData = updateMaterialServiceSchema.parse(req.body);

      // Check if material/service exists
      const existingMaterialService = await this.materialServiceRepository.findById(id, tenantId);
      if (!existingMaterialService) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      // Check for duplicate code (if code is being updated)
      if (updateData.code && updateData.code !== existingMaterialService.code) {
        const existingByCode = await this.materialServiceRepository.existsByCode(updateData.code, tenantId, id);
        if (existingByCode) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `Código '${updateData.code}' já está em uso`
          });
          return;
        }
      }

      // Check for duplicate barcode (if barcode is being updated)
      if (updateData.barcode && updateData.barcode !== existingMaterialService.barcode) {
        const existingByBarcode = await this.materialServiceRepository.existsByBarcode(updateData.barcode, tenantId, id);
        if (existingByBarcode) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `Código de barras '${updateData.barcode}' já está em uso`
          });
          return;
        }
      }

      // Additional business validation for services
      if (existingMaterialService.type === 'service') {
        if (updateData.stockQuantity !== undefined || 
            updateData.minimumStock !== undefined || 
            updateData.maximumStock !== undefined) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Serviços não devem ter controle de estoque'
          });
          return;
        }
        if (updateData.expirationDate) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Serviços não podem ter data de expiração'
          });
          return;
        }
      }

      // Update material/service
      const updatedMaterialService = await this.materialServiceRepository.update(id, tenantId, {
        ...updateData,
        updatedBy: req.user?.id,
        updatedAt: new Date()
      });

      if (!updatedMaterialService) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedMaterialService,
        message: 'Item atualizado com sucesso'
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

      console.error('[MATERIALSERVICE-CONTROLLER] Error updating material/service:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao atualizar item'
      });
    }
  }

  /**
   * Delete material/service
   * DELETE /api/materials-services-integration/working/materials-services/:id
   */
  async deleteMaterialService(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const deleted = await this.materialServiceRepository.delete(id, tenantId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Item desativado com sucesso'
      });

    } catch (error) {
      console.error('[MATERIALSERVICE-CONTROLLER] Error deleting material/service:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao desativar item'
      });
    }
  }

  /**
   * Search materials/services
   * GET /api/materials-services-integration/working/search
   */
  async searchMaterialsServices(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const searchParams = searchMaterialServiceSchema.parse(req.query);

      const materialsServices = await this.materialServiceRepository.search(searchParams.query, tenantId, {
        type: searchParams.type,
        category: searchParams.category,
        supplier: searchParams.supplier,
        brand: searchParams.brand,
        location: searchParams.location,
        isActive: searchParams.isActive
      });

      res.json({
        success: true,
        data: materialsServices,
        count: materialsServices.length,
        message: 'Busca realizada com sucesso'
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

      console.error('[MATERIALSERVICE-CONTROLLER] Error searching materials/services:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha na busca'
      });
    }
  }

  /**
   * Get materials/services statistics
   * GET /api/materials-services-integration/working/statistics
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

      const statistics = await this.materialServiceRepository.getStatistics(tenantId);

      res.json({
        success: true,
        data: statistics,
        message: 'Estatísticas recuperadas com sucesso'
      });

    } catch (error) {
      console.error('[MATERIALSERVICE-CONTROLLER] Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Update stock quantity
   * PUT /api/materials-services-integration/working/materials-services/:id/stock
   */
  async updateStock(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { quantity, reason } = stockUpdateSchema.parse(req.body);

      // Check if material/service exists and is not a service
      const materialService = await this.materialServiceRepository.findById(id, tenantId);
      if (!materialService) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      if (materialService.type === 'service') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Não é possível atualizar estoque de serviços'
        });
        return;
      }

      const updatedMaterialService = await this.materialServiceRepository.updateStock(id, tenantId, quantity, req.user?.id);

      if (!updatedMaterialService) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      // Log stock movement
      await this.materialServiceRepository.addStockMovement({
        materialServiceId: id,
        tenantId,
        movementType: 'adjustment',
        quantity,
        reason,
        movedAt: new Date(),
        movedBy: req.user?.id
      });

      res.json({
        success: true,
        data: updatedMaterialService,
        message: 'Estoque atualizado com sucesso'
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

      console.error('[MATERIALSERVICE-CONTROLLER] Error updating stock:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao atualizar estoque'
      });
    }
  }

  /**
   * Update price
   * PUT /api/materials-services-integration/working/materials-services/:id/price
   */
  async updatePrice(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { price, reason } = priceUpdateSchema.parse(req.body);

      const updatedMaterialService = await this.materialServiceRepository.updatePrice(id, tenantId, price, req.user?.id, reason);

      if (!updatedMaterialService) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedMaterialService,
        message: 'Preço atualizado com sucesso'
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

      console.error('[MATERIALSERVICE-CONTROLLER] Error updating price:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao atualizar preço'
      });
    }
  }

  /**
   * Add tag to material/service
   * POST /api/materials-services-integration/working/materials-services/:id/tags
   */
  async addTag(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { tag } = tagOperationSchema.parse(req.body);

      const success = await this.materialServiceRepository.addTag(id, tenantId, tag, req.user?.id);
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Tag adicionada com sucesso'
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

      console.error('[MATERIALSERVICE-CONTROLLER] Error adding tag:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao adicionar tag'
      });
    }
  }

  /**
   * Remove tag from material/service
   * DELETE /api/materials-services-integration/working/materials-services/:id/tags
   */
  async removeTag(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { tag } = tagOperationSchema.parse(req.body);

      const success = await this.materialServiceRepository.removeTag(id, tenantId, tag, req.user?.id);
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Item não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Tag removida com sucesso'
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

      console.error('[MATERIALSERVICE-CONTROLLER] Error removing tag:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao remover tag'
      });
    }
  }
}