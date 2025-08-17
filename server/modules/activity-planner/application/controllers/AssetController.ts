/**
 * AssetController - Controller para operações de ativos
 * Coordena casos de uso e apresentação de dados de ativos
 * Seguindo padrões Clean Architecture e 1qa.md
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth.js';
import { AssetApplicationService } from '../services/AssetApplicationService';
import { insertAssetSchema } from '@shared/schema-activity-planner';

export class AssetController {
  constructor(
    private assetApplicationService: AssetApplicationService
  ) {}

  async createAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [AssetController] Creating asset...');
      
      const validation = insertAssetSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [AssetController] Validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const asset = await this.assetApplicationService.createAsset(
        req.user.tenantId,
        validation.data,
        req.user.id
      );

      console.log('✅ [AssetController] Asset created:', asset.id);
      res.status(201).json({
        success: true,
        data: asset,
        message: 'Ativo criado com sucesso'
      });
    } catch (error) {
      console.error('❌ [AssetController] Error creating asset:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAssets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [AssetController] Getting assets...');
      
      const querySchema = z.object({
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).max(100).optional().default(20),
        locationId: z.string().uuid().optional(),
        parentAssetId: z.string().uuid().optional(),
        criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']).optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
        needsMaintenance: z.coerce.boolean().optional(),
        sortBy: z.enum(['tag', 'name', 'criticality', 'lastMaintenanceDate', 'nextMaintenanceDate']).optional().default('name'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
        includeHierarchy: z.coerce.boolean().optional().default(false)
      });

      const validation = querySchema.safeParse(req.query);
      if (!validation.success) {
        console.log('❌ [AssetController] Query validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Parâmetros de consulta inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const { 
        includeHierarchy, 
        page, 
        limit, 
        sortBy, 
        sortOrder, 
        ...filters 
      } = validation.data;

      if (includeHierarchy && filters.locationId) {
        // Retornar hierarquia por localização
        const hierarchy = await this.assetApplicationService.getAssetHierarchyByLocation(
          req.user.tenantId,
          filters.locationId
        );
        
        res.json({
          success: true,
          data: hierarchy,
          message: 'Hierarquia de ativos obtida com sucesso'
        });
      } else {
        // Retornar lista paginada
        const result = await this.assetApplicationService.getAssets(
          req.user.tenantId,
          filters,
          { page, limit, sortBy, sortOrder }
        );

        console.log(`✅ [AssetController] Found ${result.assets.length} assets`);
        res.json({
          success: true,
          data: result.assets,
          meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: Math.ceil(result.total / result.limit)
          },
          message: 'Ativos obtidos com sucesso'
        });
      }
    } catch (error) {
      console.error('❌ [AssetController] Error getting assets:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAssetById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [AssetController] Getting asset by ID:', req.params.id);
      
      const asset = await this.assetApplicationService.getAssetById(
        req.user.tenantId,
        req.params.id
      );

      if (!asset) {
        res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
        return;
      }

      console.log('✅ [AssetController] Asset found:', asset.id);
      res.json({
        success: true,
        data: asset,
        message: 'Ativo obtido com sucesso'
      });
    } catch (error) {
      console.error('❌ [AssetController] Error getting asset:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [AssetController] Updating asset:', req.params.id);
      
      const updateSchema = insertAssetSchema.partial();
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.log('❌ [AssetController] Validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      const asset = await this.assetApplicationService.updateAsset(
        req.user.tenantId,
        req.params.id,
        validation.data,
        req.user.id
      );

      console.log('✅ [AssetController] Asset updated:', asset.id);
      res.json({
        success: true,
        data: asset,
        message: 'Ativo atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ [AssetController] Error updating asset:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🗑️ [AssetController] Deleting asset:', req.params.id);
      
      const hardDelete = req.query.hard === 'true';
      
      if (hardDelete) {
        await this.assetApplicationService.deleteAsset(
          req.user.tenantId,
          req.params.id
        );
      } else {
        await this.assetApplicationService.deactivateAsset(
          req.user.tenantId,
          req.params.id,
          req.user.id
        );
      }

      console.log('✅ [AssetController] Asset deleted');
      res.json({
        success: true,
        message: hardDelete ? 'Ativo excluído permanentemente' : 'Ativo desativado com sucesso'
      });
    } catch (error) {
      console.error('❌ [AssetController] Error deleting asset:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAssetHierarchy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [AssetController] Getting asset hierarchy:', req.params.id);
      
      const hierarchy = await this.assetApplicationService.getAssetHierarchy(
        req.user.tenantId,
        req.params.id
      );

      console.log('✅ [AssetController] Asset hierarchy obtained');
      res.json({
        success: true,
        data: hierarchy,
        message: 'Hierarquia do ativo obtida com sucesso'
      });
    } catch (error) {
      console.error('❌ [AssetController] Error getting asset hierarchy:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateAssetMeter(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔧 [AssetController] Updating asset meter:', req.params.id);
      
      const meterSchema = z.object({
        meterName: z.string().min(1, 'Nome do medidor é obrigatório'),
        value: z.number().min(0, 'Valor deve ser positivo')
      });

      const validation = meterSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('❌ [AssetController] Meter validation failed:', validation.error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validation.error.errors
        });
        return;
      }

      await this.assetApplicationService.updateAssetMeter(
        req.user.tenantId,
        req.params.id,
        validation.data.meterName,
        validation.data.value,
        req.user.id
      );

      console.log('✅ [AssetController] Asset meter updated');
      res.json({
        success: true,
        message: 'Medidor do ativo atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ [AssetController] Error updating asset meter:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAssetStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📊 [AssetController] Getting asset statistics');
      
      const stats = await this.assetApplicationService.getAssetStatistics(
        req.user.tenantId
      );

      console.log('✅ [AssetController] Asset statistics obtained');
      res.json({
        success: true,
        data: stats,
        message: 'Estatísticas de ativos obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ [AssetController] Error getting asset stats:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAssetsNeedingMaintenance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [AssetController] Getting assets needing maintenance');
      
      const assets = await this.assetApplicationService.getAssetsNeedingMaintenance(
        req.user.tenantId
      );

      console.log(`✅ [AssetController] Found ${assets.length} assets needing maintenance`);
      res.json({
        success: true,
        data: assets,
        message: 'Ativos que precisam de manutenção obtidos com sucesso'
      });
    } catch (error) {
      console.error('❌ [AssetController] Error getting assets needing maintenance:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}