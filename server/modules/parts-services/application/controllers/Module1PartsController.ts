import { Request, Response } from 'express';
import { Module1PartsRepository } from '../../infrastructure/repositories/Module1PartsRepository';
import { insertPartSchema, updatePartSchema } from '@shared/schema-parts-module1-complete';

export class Module1PartsController {
  private repository: Module1PartsRepository;

  constructor() {
    this.repository = new Module1PartsRepository();
  }

  // GET /api/parts-services/module1/parts - Listar todas as peças
  async getParts(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ message: 'Tenant ID não encontrado' });
        return;
      }

      const filters = {
        category: req.query.category as string,
        subcategory: req.query.subcategory as string,
        status: req.query.status as string,
        abcClassification: req.query.abcClassification as string,
        obsolescenceStatus: req.query.obsolescenceStatus as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const parts = await this.repository.findAllParts(tenantId, filters);
      
      console.log(`✅ Module1 Parts found: ${parts.length} parts for tenant ${tenantId}`);
      res.json(parts);
    } catch (error) {
      console.error('❌ Error in getParts:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/parts-services/module1/parts/:id - Buscar peça por ID
  async getPartById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ message: 'Tenant ID não encontrado' });
        return;
      }

      const part = await this.repository.findPartById(tenantId, id);
      
      if (!part) {
        res.status(404).json({ message: 'Peça não encontrada' });
        return;
      }

      console.log(`✅ Module1 Part found: ${part.name} (${part.internalCode})`);
      res.json(part);
    } catch (error) {
      console.error('❌ Error in getPartById:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/parts-services/module1/parts - Criar nova peça
  async createPart(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId) {
        res.status(401).json({ message: 'Tenant ID não encontrado' });
        return;
      }

      // Validar dados de entrada
      const validationResult = insertPartSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ 
          message: 'Dados inválidos',
          errors: validationResult.error.errors
        });
        return;
      }

      const partData = {
        ...validationResult.data,
        tenantId,
        createdBy: userId,
        updatedBy: userId
      };

      const newPart = await this.repository.createPart(tenantId, partData);
      
      if (!newPart) {
        res.status(500).json({ message: 'Erro ao criar peça' });
        return;
      }

      console.log(`✅ Module1 Part created: ${newPart.name} (${newPart.internalCode})`);
      res.status(201).json(newPart);
    } catch (error) {
      console.error('❌ Error in createPart:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/parts-services/module1/parts/:id - Atualizar peça
  async updatePart(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ message: 'Tenant ID não encontrado' });
        return;
      }

      // Validar dados de entrada
      const validationResult = updatePartSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ 
          message: 'Dados inválidos',
          errors: validationResult.error.errors
        });
        return;
      }

      const updateData = {
        ...validationResult.data,
        updatedBy: userId
      };

      const updatedPart = await this.repository.updatePart(tenantId, id, updateData);
      
      if (!updatedPart) {
        res.status(404).json({ message: 'Peça não encontrada ou erro ao atualizar' });
        return;
      }

      console.log(`✅ Module1 Part updated: ${updatedPart.name} (${updatedPart.internalCode})`);
      res.json(updatedPart);
    } catch (error) {
      console.error('❌ Error in updatePart:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/parts-services/module1/parts/:id - Remover peça
  async deletePart(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ message: 'Tenant ID não encontrado' });
        return;
      }

      const deleted = await this.repository.deletePart(tenantId, id);
      
      if (!deleted) {
        res.status(404).json({ message: 'Peça não encontrada' });
        return;
      }

      console.log(`✅ Module1 Part deleted: ID ${id}`);
      res.json({ message: 'Peça removida com sucesso' });
    } catch (error) {
      console.error('❌ Error in deletePart:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/parts-services/module1/stats - Estatísticas do módulo
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ message: 'Tenant ID não encontrado' });
        return;
      }

      const stats = await this.repository.getPartsStats(tenantId);
      
      console.log(`✅ Module1 Stats retrieved for tenant ${tenantId}:`, stats);
      res.json(stats);
    } catch (error) {
      console.error('❌ Error in getStats:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}