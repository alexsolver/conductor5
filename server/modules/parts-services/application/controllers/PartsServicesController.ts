import { PartsServicesRepository } from "../../domain/repositories/PartsServicesRepository";
import { DirectPartsServicesRepository } from "../../infrastructure/repositories/DirectPartsServicesRepository";
import { AuthenticatedRequest } from "../../../middleware/jwtAuth";
import { Request, Response } from 'express';
import {
  type ActivityType,
  type ServiceKit,
  type InsertActivityType,
  type InsertServiceKit,
  type Inventory,
  type Supplier,
  type InsertInventory,
  type InsertSupplier
} from "@shared/schema";

export class PartsServicesController {
  private repository: DirectPartsServicesRepository;

  constructor(repository?: DirectPartsServicesRepository) {
    this.repository = repository || new DirectPartsServicesRepository();
  }

  // ===== MÓDULO 1: GESTÃO DE PEÇAS =====
  getParts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const parts = await this.repository.findParts(tenantId);
      res.json(parts);
    } catch (error) {
      console.error('Error fetching parts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPart = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Tenant ID required' 
        });
      }

      // Validação de dados obrigatórios
      const { internal_code, manufacturer_code, title, cost_price, sale_price } = req.body;
      if (!internal_code || !manufacturer_code || !title || !cost_price || !sale_price) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Campos obrigatórios não preenchidos',
          required: ['internal_code', 'manufacturer_code', 'title', 'cost_price', 'sale_price']
        });
      }

      // Validação de preços
      const costPrice = parseFloat(cost_price);
      const salePrice = parseFloat(sale_price);
      
      if (isNaN(costPrice) || isNaN(salePrice) || costPrice < 0 || salePrice < 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Preços devem ser números positivos'
        });
      }

      if (salePrice <= costPrice) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Preço de venda deve ser maior que o preço de custo'
        });
      }

      const part = await this.repository.createPart(tenantId, req.body);
      res.status(201).json({
        success: true,
        data: part,
        message: 'Peça criada com sucesso'
      });
    } catch (error: any) {
      console.error('Error creating part:', error);
      
      if (error.message.includes('Campos obrigatórios')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message
        });
      }

      if (error.code === '23505') { // Duplicate key error
        return res.status(409).json({
          error: 'Conflict',
          message: 'Código interno já existe'
        });
      }

      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== MÓDULO 2: CONTROLE DE ESTOQUE =====
  getInventory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const inventory = await this.repository.findInventory(tenantId);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createInventoryEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const entry = await this.repository.createInventoryEntry(tenantId, req.body);
      res.status(201).json(entry);
    } catch (error) {
      console.error('Error creating inventory entry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== DASHBOARD COM DADOS REAIS =====
  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const stats = await this.repository.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message || 'Erro ao obter estatísticas do dashboard',
        totalParts: 0,
        totalSuppliers: 0,
        totalInventory: 0,
        totalOrders: 0,
        totalSimulations: 0,
        totalStockValue: 0
      });
    }
  };

  // ===== MÓDULO 3: GESTÃO DE FORNECEDORES =====
  getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const suppliers = await this.repository.findSuppliers(tenantId);
      res.json(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Tenant ID required' 
        });
      }

      // Validação de dados obrigatórios
      const { supplier_code, name, trade_name, email } = req.body;
      if (!supplier_code || !name || !trade_name || !email) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Campos obrigatórios não preenchidos',
          required: ['supplier_code', 'name', 'trade_name', 'email']
        });
      }

      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Formato de email inválido'
        });
      }

      const supplier = await this.repository.createSupplier(tenantId, req.body);
      res.status(201).json({
        success: true,
        data: supplier,
        message: 'Fornecedor criado com sucesso'
      });
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      
      if (error.message.includes('obrigatórios') || error.message.includes('inválido')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message
        });
      }

      if (error.code === '23505') { // Duplicate key error
        return res.status(409).json({
          error: 'Conflict',
          message: 'Código do fornecedor já existe'
        });
      }

      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  };

  // ===== MÓDULO 4: PLANEJAMENTO E COMPRAS =====
  getPurchaseOrdersComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const pos = await this.repository.findPurchaseOrdersComplete(tenantId);
      res.json(pos);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPurchaseOrderComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const po = await this.repository.createPurchaseOrderComplete(tenantId, req.body);
      res.status(201).json(po);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 5: INTEGRAÇÃO COM SERVIÇOS =====
  createServiceIntegrationComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const serviceIntegration = await this.repository.createServiceIntegrationComplete({
        ...req.body,
        tenantId: req.user.tenantId,
        createdBy: req.user.id
      });

      res.status(201).json(serviceIntegration);
    } catch (error) {
      console.error("Error creating service integration:", error);
      res.status(500).json({ message: "Failed to create service integration" });
    }
  };

  getServiceIntegrationsComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const serviceIntegrations = await this.repository.findServiceIntegrationsComplete(req.user.tenantId);
      res.json(serviceIntegrations);
    } catch (error) {
      console.error("Error fetching service integrations:", error);
      res.status(500).json({ message: "Failed to fetch service integrations" });
    }
  };

  createWorkOrderIntegration = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const workOrder = await this.repository.createWorkOrderIntegrationComplete(tenantId, req.body);
      res.status(201).json(workOrder);
    } catch (error) {
      console.error('Error creating work order integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 6: LOGÍSTICA E DISTRIBUIÇÃO =====
  createTransferComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const transfer = await this.repository.createTransferComplete({
        ...req.body,
        tenantId: req.user.tenantId,
        createdBy: req.user.id
      });

      res.status(201).json(transfer);
    } catch (error) {
      console.error("Error creating transfer:", error);
      res.status(500).json({ message: "Failed to create transfer" });
    }
  };

  getTransfersComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: "User not associated with a tenant" });
      }

      const transfers = await this.repository.findTransfersComplete(req.user.tenantId);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      res.status(500).json({ message: "Failed to fetch transfers" });
    }
  };

  createReturn = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const returnItem = await this.repository.createReturnComplete(tenantId, req.body);
      res.status(201).json(returnItem);
    } catch (error) {
      console.error('Error creating return:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 7: CONTROLE DE ATIVOS =====
  getAssetsComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const assets = await this.repository.findAssetsComplete(tenantId);
      res.json(assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createAssetComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const asset = await this.repository.createAssetComplete(tenantId, req.body);
      res.status(201).json(asset);
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createAssetMaintenance = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const maintenance = await this.repository.createAssetMaintenanceComplete(tenantId, req.body);
      res.status(201).json(maintenance);
    } catch (error) {
      console.error('Error creating asset maintenance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createAssetMovement = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const movement = await this.repository.createAssetMovementComplete(tenantId, req.body);
      res.status(201).json(movement);
    } catch (error) {
      console.error('Error creating asset movement:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 8: LISTA DE PREÇOS UNITÁRIOS (LPU) =====
  getPriceListsComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const priceLists = await this.repository.findPriceListsComplete(tenantId);
      res.json(priceLists);
    } catch (error) {
      console.error('Error fetching price lists:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPriceListComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const priceList = await this.repository.createPriceListComplete(tenantId, req.body);
      res.status(201).json(priceList);
    } catch (error) {
      console.error('Error creating price list:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPriceListItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const item = await this.repository.createPriceListItemComplete(tenantId, req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating price list item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 9: FUNCIONALIDADES AVANÇADAS DE PREÇO =====
  createPricingTable = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const table = await this.repository.createPricingTableComplete(tenantId, req.body);
      res.status(201).json(table);
    } catch (error) {
      console.error('Error creating pricing table:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPricingRule = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const rule = await this.repository.createPricingRuleComplete(tenantId, req.body);
      res.status(201).json(rule);
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createPriceHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const history = await this.repository.createPriceHistoryComplete(tenantId, req.body);
      res.status(201).json(history);
    } catch (error) {
      console.error('Error creating price history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPricingTables = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const tables = await this.repository.findPricingTablesComplete(tenantId);
      res.json(tables);
    } catch (error) {
      console.error('Error fetching pricing tables:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 10: COMPLIANCE E AUDITORIA =====
  createAuditLogComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const log = await this.repository.createAuditLogComplete(tenantId, req.body);
      res.status(201).json(log);
    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createCertification = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const cert = await this.repository.createCertificationComplete(tenantId, req.body);
      res.status(201).json(cert);
    } catch (error) {
      console.error('Error creating certification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createComplianceAlert = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const alert = await this.repository.createComplianceAlertComplete(tenantId, req.body);
      res.status(201).json(alert);
    } catch (error) {
      console.error('Error creating compliance alert:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getAuditLogsComplete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const logs = await this.repository.findAuditLogsComplete(tenantId);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== MÓDULO 11: DIFERENCIAIS AVANÇADOS =====
  getBudgetSimulations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const simulations = await this.repository.findBudgetSimulationsComplete(tenantId);
      res.json(simulations);
    } catch (error) {
      console.error('Error fetching budget simulations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createBudgetSimulation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const simulation = await this.repository.createBudgetSimulationComplete(tenantId, req.body);
      res.status(201).json(simulation);
    } catch (error) {
      console.error('Error creating budget simulation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createDashboardConfig = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const config = await this.repository.createDashboardConfigComplete(tenantId, req.body);
      res.status(201).json(config);
    } catch (error) {
      console.error('Error creating dashboard config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createIntegrationApi = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const api = await this.repository.createIntegrationApiComplete(tenantId, req.body);
      res.status(201).json(api);
    } catch (error) {
      console.error('Error creating integration API:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createOfflineSync = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const sync = await this.repository.createOfflineSyncComplete(tenantId, req.body);
      res.status(201).json(sync);
    } catch (error) {
      console.error('Error creating offline sync:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== CRUD METHODS FOR PARTS =====
  updatePart = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const part = await this.repository.updatePart(id, tenantId, req.body);
      if (!part) {
        return res.status(404).json({ error: 'Part not found' });
      }
      res.json(part);
    } catch (error) {
      console.error('Error updating part:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deletePart = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const deleted = await this.repository.deletePart(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: 'Part not found' });
      }
      res.json({ message: 'Part deleted successfully' });
    } catch (error) {
      console.error('Error deleting part:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== CRUD METHODS FOR SUPPLIERS =====
  updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const supplier = await this.repository.updateSupplier(id, tenantId, req.body);
      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      res.json(supplier);
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const deleted = await this.repository.deleteSupplier(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ===== CRUD METHODS FOR INVENTORY =====
  updateInventory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const inventory = await this.repository.updateInventory(id, tenantId, req.body);
      if (!inventory) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      res.json(inventory);
    } catch (error) {
      console.error('Error updating inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteInventory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' });
      }
      const deleted = await this.repository.deleteInventory(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
      console.error('Error deleting inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}