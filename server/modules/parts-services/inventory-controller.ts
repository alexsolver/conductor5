import { Request, Response } from 'express';
import { z } from 'zod';
import { DrizzleInventoryRepository } from './inventory-repository';
import { db } from '../../db';
import { createInsertSchema } from 'drizzle-zod';
import * as schema from '@shared/schema';

// Schemas de validação
const stockLocationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  type: z.enum(['fixed', 'mobile', 'virtual', 'consignment']),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().default(true),
  managerId: z.string().optional(),
  capacity: z.number().optional(),
  currentOccupancy: z.number().default(0),
});

const stockMovementSchema = z.object({
  itemId: z.string().min(1, 'Item é obrigatório'),
  locationId: z.string().min(1, 'Localização é obrigatória'),
  movementType: z.enum(['in', 'out', 'transfer', 'adjustment', 'return']),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unitCost: z.number().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  reasonCode: z.string().optional(),
  notes: z.string().optional(),
  batchNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  expiryDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

const stockTransferSchema = z.object({
  fromLocationId: z.string().min(1, 'Localização origem é obrigatória'),
  toLocationId: z.string().min(1, 'Localização destino é obrigatória'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  expectedDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Item é obrigatório'),
    requestedQuantity: z.number().positive('Quantidade deve ser positiva'),
    unitCost: z.number().optional(),
    notes: z.string().optional(),
  })).min(1, 'Pelo menos um item é necessário'),
});

const serviceKitSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  description: z.string().optional(),
  kitType: z.enum(['maintenance', 'repair', 'installation', 'emergency']),
  equipmentType: z.string().optional(),
  maintenanceType: z.enum(['preventive', 'corrective', 'predictive']).optional(),
  estimatedCost: z.number().optional(),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Item é obrigatório'),
    quantity: z.number().positive('Quantidade deve ser positiva'),
    isOptional: z.boolean().default(false),
    priority: z.number().default(1),
    notes: z.string().optional(),
  })).min(1, 'Pelo menos um item é necessário'),
});

export class InventoryController {
  
  // DASHBOARD - Estatísticas do Inventário
  async getInventoryStats(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const stats = await repository.getInventoryStats();
      
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do inventário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // STOCK LOCATIONS
  async createStockLocation(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const validatedData = stockLocationSchema.parse(req.body);
      const repository = new DrizzleInventoryRepository(db, tenantId);
      const location = await repository.createStockLocation(validatedData);
      
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao criar localização de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getStockLocations(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const locations = await repository.getStockLocations();
      
      res.json(locations);
    } catch (error) {
      console.error('Erro ao buscar localizações de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getStockLocationById(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const location = await repository.getStockLocationById(id);
      
      if (!location) {
        return res.status(404).json({ error: 'Localização não encontrada' });
      }
      
      res.json(location);
    } catch (error) {
      console.error('Erro ao buscar localização de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateStockLocation(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const validatedData = stockLocationSchema.partial().parse(req.body);
      const repository = new DrizzleInventoryRepository(db, tenantId);
      const location = await repository.updateStockLocation(id, validatedData);
      
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao atualizar localização de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteStockLocation(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const repository = new DrizzleInventoryRepository(db, tenantId);
      await repository.deleteStockLocation(id);
      
      res.json({ message: 'Localização removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover localização de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // STOCK LEVELS
  async getStockLevels(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const filters = {
        locationId: req.query.locationId as string,
        itemId: req.query.itemId as string,
        lowStock: req.query.lowStock === 'true',
      };

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const levels = await repository.getStockLevels(filters);
      
      res.json(levels);
    } catch (error) {
      console.error('Erro ao buscar níveis de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateStockLevel(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { itemId, locationId } = req.params;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const validatedData = z.object({
        currentQuantity: z.number().optional(),
        minimumLevel: z.number().optional(),
        maximumLevel: z.number().optional(),
        reorderPoint: z.number().optional(),
        economicOrderQuantity: z.number().optional(),
        unitCost: z.number().optional(),
      }).parse(req.body);

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const level = await repository.updateStockLevel(itemId, locationId, validatedData);
      
      res.json(level);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao atualizar nível de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // STOCK MOVEMENTS
  async createStockMovement(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ error: 'Tenant ID e User ID são obrigatórios' });
      }

      const validatedData = stockMovementSchema.parse(req.body);
      const repository = new DrizzleInventoryRepository(db, tenantId);
      const movement = await repository.createStockMovement({
        ...validatedData,
        userId,
      });
      
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao criar movimentação de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getStockMovements(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const filters = {
        locationId: req.query.locationId as string,
        itemId: req.query.itemId as string,
        movementType: req.query.movementType as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const movements = await repository.getStockMovements(filters);
      
      res.json(movements);
    } catch (error) {
      console.error('Erro ao buscar movimentações de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // STOCK TRANSFERS
  async createStockTransfer(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ error: 'Tenant ID e User ID são obrigatórios' });
      }

      const validatedData = stockTransferSchema.parse(req.body);
      
      // Gerar número de transferência único
      const transferNumber = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const repository = new DrizzleInventoryRepository(db, tenantId);
      const transfer = await repository.createStockTransfer({
        ...validatedData,
        transferNumber,
        requestedBy: userId,
      });
      
      res.status(201).json(transfer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao criar transferência de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getStockTransfers(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const filters = {
        status: req.query.status as string,
        fromLocationId: req.query.fromLocationId as string,
        toLocationId: req.query.toLocationId as string,
      };

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const transfers = await repository.getStockTransfers(filters);
      
      res.json(transfers);
    } catch (error) {
      console.error('Erro ao buscar transferências de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // SERVICE KITS
  async createServiceKit(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(400).json({ error: 'Tenant ID e User ID são obrigatórios' });
      }

      const validatedData = serviceKitSchema.parse(req.body);
      const repository = new DrizzleInventoryRepository(db, tenantId);
      const kit = await repository.createServiceKit({
        ...validatedData,
        createdBy: userId,
      });
      
      res.status(201).json(kit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao criar kit de serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getServiceKits(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const filters = {
        kitType: req.query.kitType as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      };

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const kits = await repository.getServiceKits(filters);
      
      res.json(kits);
    } catch (error) {
      console.error('Erro ao buscar kits de serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getServiceKitById(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const repository = new DrizzleInventoryRepository(db, tenantId);
      const kit = await repository.getServiceKitById(id);
      
      if (!kit) {
        return res.status(404).json({ error: 'Kit de serviço não encontrado' });
      }
      
      res.json(kit);
    } catch (error) {
      console.error('Erro ao buscar kit de serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}