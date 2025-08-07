import { Response } from 'express';
import { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { db } from '../../../../db';
import { LPURepository } from '../../infrastructure/repositories/LPURepository';
import { PricingRulesEngine } from '../services/PricingRulesEngine';

export class LPUController {
  private repository: LPURepository;
  private pricingEngine: PricingRulesEngine;

  constructor(db: any) {
    try {
      console.log('🏗️ LPUController: Initializing...');
      console.log('🏗️ LPUController: DB object received:', typeof db, !!db);
      
      if (!db) {
        throw new Error('Database connection is required but was not provided');
      }
      
      console.log('🏗️ LPUController: Creating repository...');
      this.repository = new LPURepository(db);
      console.log('✅ LPUController: Repository created successfully');
      
      console.log('🏗️ LPUController: Creating pricing engine...');
      this.pricingEngine = new PricingRulesEngine(this.repository);
      console.log('✅ LPUController: Pricing engine created successfully');
      
      console.log('✅ LPUController: Initialization complete');
    } catch (error) {
      console.error('❌ LPUController: Initialization failed:', error);
      console.error('❌ LPUController: Error stack:', error.stack);
      throw new Error(`LPUController initialization failed: ${error.message}`);
    }
  }

  // GESTÃO DE LISTAS DE PREÇOS
  async getAllPriceLists(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('🔍 LPUController.getAllPriceLists: Starting...');
      const tenantId = req.user?.tenantId;
      console.log('🔍 LPUController.getAllPriceLists: TenantId:', tenantId);

      if (!tenantId) {
        console.log('❌ LPUController.getAllPriceLists: Missing tenant ID');
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      console.log('🔍 LPUController.getAllPriceLists: Calling repository...');
      const priceLists = await this.repository.getAllPriceLists(tenantId);
      console.log('✅ LPUController.getAllPriceLists: Success, found', priceLists?.length || 0, 'price lists');
      res.json(priceLists);
    } catch (error) {
      console.error('❌ LPUController.getAllPriceLists: Error:', error);
      console.error('❌ LPUController.getAllPriceLists: Stack:', error.stack);
      res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  }

  async getPriceListById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const priceList = await this.repository.getPriceListById(id, tenantId);
      if (!priceList) {
        return res.status(404).json({ error: 'Lista de preços não encontrada' });
      }

      res.json(priceList);
    } catch (error) {
      console.error('Erro ao buscar lista de preços:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createPriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      // Auto-generate code if not provided
      const timestamp = Date.now();
      const nameSlug = req.body.name?.replace(/\s+/g, '_').substring(0, 10) || 'LIST';
      const autoCode = `${nameSlug}_${timestamp}`;

      // Handle date conversion properly
      const priceListData = {
        ...req.body,
        tenantId,
        createdBy: req.user?.id,
        code: req.body.code || autoCode,
        version: req.body.version || '1.0',
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : new Date(),
        validTo: req.body.validTo ? new Date(req.body.validTo) : null
      };

      const priceList = await this.repository.createPriceList(priceListData);
      res.status(201).json(priceList);
    } catch (error) {
      console.error('Erro ao criar lista de preços:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updatePriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user?.id
      };

      const priceList = await this.repository.updatePriceList(id, tenantId, updateData);
      if (!priceList) {
        return res.status(404).json({ error: 'Lista de preços não encontrada' });
      }

      res.json(priceList);
    } catch (error) {
      console.error('Erro ao atualizar lista de preços:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async duplicatePriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      // Buscar a lista original
      const originalList = await this.repository.getPriceListById(id, tenantId);
      if (!originalList) {
        return res.status(404).json({ error: 'Lista de preços não encontrada' });
      }

      // Criar dados para duplicação
      const duplicateData = {
        ...originalList,
        name: `${originalList.name} (Cópia)`,
        code: `${originalList.code}_COPY_${Date.now()}`,
        version: "1.0",
        validFrom: new Date().toISOString(),
        validTo: null,
        tenantId,
        createdBy: req.user?.id,
        updatedBy: req.user?.id
      };

      // Remover campos que não devem ser duplicados
      delete (duplicateData as any).id;
      delete (duplicateData as any).createdAt;
      delete (duplicateData as any).updatedAt;

      const duplicatedList = await this.repository.createPriceList(duplicateData);
      res.status(201).json(duplicatedList);
    } catch (error) {
      console.error('Erro ao duplicar lista de preços:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deletePriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.repository.deletePriceList(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir lista de preços:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // VERSIONAMENTO E WORKFLOW DE APROVAÇÃO
  async getPriceListVersions(req: AuthenticatedRequest, res: Response) {
    try {
      const { priceListId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const versions = await this.repository.getPriceListVersions(priceListId, tenantId);
      res.json(versions);
    } catch (error) {
      console.error('Erro ao buscar versões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createPriceListVersion(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const versionData = {
        ...req.body,
        tenantId
      };

      const version = await this.repository.createPriceListVersion(versionData);
      res.status(201).json(version);
    } catch (error) {
      console.error('Erro ao criar versão:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async submitForApproval(req: AuthenticatedRequest, res: Response) {
    try {
      const { versionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const version = await this.repository.submitForApproval(versionId, tenantId, req.user?.id!);
      res.json(version);
    } catch (error) {
      console.error('Erro ao submeter para aprovação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async approvePriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const { versionId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const version = await this.repository.approvePriceList(versionId, tenantId, req.user?.id!);
      res.json(version);
    } catch (error) {
      console.error('Erro ao aprovar lista de preços:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async rejectPriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const { versionId } = req.params;
      const { reason } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      if (!reason) {
        return res.status(400).json({ error: 'Motivo da rejeição é obrigatório' });
      }

      const version = await this.repository.rejectPriceList(versionId, tenantId, req.user?.id!, reason);
      res.json(version);
    } catch (error) {
      console.error('Erro ao rejeitar lista de preços:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ITENS DA LISTA DE PREÇOS
  async getPriceListItems(req: AuthenticatedRequest, res: Response) {
    try {
      const { priceListId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const items = await this.repository.getPriceListItems(priceListId, tenantId);
      res.json(items);
    } catch (error) {
      console.error('Erro ao buscar itens da lista:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async addPriceListItem(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const itemData = {
        ...req.body,
        tenantId
      };

      const item = await this.repository.addPriceListItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error('Erro ao adicionar item à lista:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updatePriceListItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const item = await this.repository.updatePriceListItem(id, tenantId, req.body);
      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      res.json(item);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deletePriceListItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.repository.deletePriceListItem(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // REGRAS DE PRECIFICAÇÃO
  async getAllPricingRules(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const rules = await this.repository.getAllPricingRules(tenantId);
      res.json(rules);
    } catch (error) {
      console.error('Erro ao buscar regras de precificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createPricingRule(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const ruleData = {
        ...req.body,
        tenantId
      };

      const rule = await this.repository.createPricingRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      console.error('Erro ao criar regra de precificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updatePricingRule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const rule = await this.repository.updatePricingRule(id, tenantId, req.body);
      if (!rule) {
        return res.status(404).json({ error: 'Regra não encontrada' });
      }

      res.json(rule);
    } catch (error) {
      console.error('Erro ao atualizar regra:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deletePricingRule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.repository.deletePricingRule(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir regra:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // PRECIFICAÇÃO DINÂMICA
  async getDynamicPricing(req: AuthenticatedRequest, res: Response) {
    try {
      const { priceListId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const pricing = await this.repository.getDynamicPricing(priceListId, tenantId);
      res.json(pricing);
    } catch (error) {
      console.error('Erro ao buscar precificação dinâmica:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateDynamicPricing(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const pricingData = {
        ...req.body,
        tenantId
      };

      const pricing = await this.repository.updateDynamicPricing(pricingData);
      res.json(pricing);
    } catch (error) {
      console.error('Erro ao atualizar precificação dinâmica:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // CONTROLE DE MARGEM
  async bulkUpdateMargins(req: AuthenticatedRequest, res: Response) {
    try {
      const { priceListId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const result = await this.repository.bulkUpdateMargins(priceListId, tenantId, req.body);
      res.json(result);
    } catch (error) {
      console.error('Erro ao atualizar margens:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ESTATÍSTICAS
  async getLPUStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const stats = await this.repository.getLPUStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas LPU:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ASSOCIAÇÃO DE REGRAS ÀS LISTAS
  async applyRulesToPriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const { priceListId } = req.params;
      const { ruleIds } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      // Aplicar as regras aos itens da lista
      const results = await this.repository.applyRulesToPriceList(priceListId, ruleIds, tenantId);
      res.json({ 
        success: true, 
        message: 'Regras aplicadas com sucesso',
        affectedItems: results.length 
      });
    } catch (error) {
      console.error('Erro ao aplicar regras à lista:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getPriceListRules(req: AuthenticatedRequest, res: Response) {
    try {
      const { priceListId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const rules = await this.repository.getPriceListRules(priceListId, tenantId);
      res.json(rules);
    } catch (error) {
      console.error('Erro ao buscar regras da lista:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async associateRuleWithPriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const { priceListId, ruleId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.repository.associateRuleWithPriceList(priceListId, ruleId, tenantId);
      res.json({ 
        success: true, 
        message: 'Regra associada com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao associar regra:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async removeRuleFromPriceList(req: AuthenticatedRequest, res: Response) {
    try {
      const { priceListId, ruleId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      await this.repository.removeRuleFromPriceList(priceListId, ruleId, tenantId);
      res.json({ 
        success: true, 
        message: 'Regra removida com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao remover regra:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Utility method needed by frontend routing
  async getPriceList(req: AuthenticatedRequest, res: Response) {
    return this.getPriceListById(req, res);
  }

  // Additional methods needed by frontend
  async getPricingRule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID é obrigatório' });
      }

      const rule = await this.repository.getPricingRuleById(id, tenantId);
      if (!rule) {
        return res.status(404).json({ error: 'Regra não encontrada' });
      }

      res.json(rule);
    } catch (error) {
      console.error('Erro ao buscar regra:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}