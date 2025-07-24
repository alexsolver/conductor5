
import { Request, Response } from 'express';
import { PartsServicesRepository } from '../../infrastructure/repositories/PartsServicesRepository.ts';
import { insertItemSchema, insertSupplierSchema, insertCustomerCompanySchema, 
         insertStockLocationSchema, insertStockMovementSchema, insertServiceKitSchema, 
         insertPriceListSchema, insertAssetSchema } from '../../../../../shared/schema-parts-services.ts';

export class PartsServicesController {
  private repository: PartsServicesRepository;

  constructor() {
    this.repository = new PartsServicesRepository();
  }

  // ==================== ITENS ====================
  
  getItems = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { search } = req.query;
      
      const items = await this.repository.getItems(tenantId, search as string);
      res.json({ success: true, data: items });
    } catch (error) {
      console.error('Error in getItems:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getItemById = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const item = await this.repository.getItemById(tenantId, id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      res.json({ success: true, data: item });
    } catch (error) {
      console.error('Error in getItemById:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  createItem = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: userId } = req.user as any;
      
      const validatedData = insertItemSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId
      });
      
      const item = await this.repository.createItem(validatedData);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in createItem:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  updateItem = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const item = await this.repository.updateItem(tenantId, id, req.body);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      res.json({ success: true, data: item });
    } catch (error) {
      console.error('Error in updateItem:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  deleteItem = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const deleted = await this.repository.deleteItem(tenantId, id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error in deleteItem:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== FORNECEDORES ====================
  
  getSuppliers = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { search } = req.query;
      
      const suppliers = await this.repository.getSuppliers(tenantId, search as string);
      res.json({ success: true, data: suppliers });
    } catch (error) {
      console.error('Error in getSuppliers:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getSupplierById = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const supplier = await this.repository.getSupplierById(tenantId, id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      
      res.json({ success: true, data: supplier });
    } catch (error) {
      console.error('Error in getSupplierById:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  createSupplier = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: userId } = req.user as any;
      
      const validatedData = insertSupplierSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId
      });
      
      const supplier = await this.repository.createSupplier(validatedData);
      res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      console.error('Error in createSupplier:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  updateSupplier = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const supplier = await this.repository.updateSupplier(tenantId, id, req.body);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      
      res.json({ success: true, data: supplier });
    } catch (error) {
      console.error('Error in updateSupplier:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  deleteSupplier = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const deleted = await this.repository.deleteSupplier(tenantId, id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      
      res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error in deleteSupplier:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== EMPRESAS CLIENTES ====================
  
  getCustomerCompanies = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { search } = req.query;
      
      const companies = await this.repository.getCustomerCompanies(tenantId, search as string);
      res.json({ success: true, data: companies });
    } catch (error) {
      console.error('Error in getCustomerCompanies:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  createCustomerCompany = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      
      const validatedData = insertCustomerCompanySchema.parse({
        ...req.body,
        tenantId
      });
      
      const company = await this.repository.createCustomerCompany(validatedData);
      res.status(201).json({ success: true, data: company });
    } catch (error) {
      console.error('Error in createCustomerCompany:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  updateCustomerCompany = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const company = await this.repository.updateCustomerCompany(tenantId, id, req.body);
      if (!company) {
        return res.status(404).json({ success: false, message: 'Customer company not found' });
      }
      
      res.json({ success: true, data: company });
    } catch (error) {
      console.error('Error in updateCustomerCompany:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  deleteCustomerCompany = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const deleted = await this.repository.deleteCustomerCompany(tenantId, id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Customer company not found' });
      }
      
      res.json({ success: true, message: 'Customer company deleted successfully' });
    } catch (error) {
      console.error('Error in deleteCustomerCompany:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== LOCALIZAÇÕES DE ESTOQUE ====================
  
  getStockLocations = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      
      const locations = await this.repository.getStockLocations(tenantId);
      res.json({ success: true, data: locations });
    } catch (error) {
      console.error('Error in getStockLocations:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  createStockLocation = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      
      const validatedData = insertStockLocationSchema.parse({
        ...req.body,
        tenantId
      });
      
      const location = await this.repository.createStockLocation(validatedData);
      res.status(201).json({ success: true, data: location });
    } catch (error) {
      console.error('Error in createStockLocation:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== CONTROLE DE ESTOQUE ====================
  
  getInventory = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { itemId, locationId } = req.query;
      
      const inventory = await this.repository.getInventory(tenantId, itemId as string, locationId as string);
      res.json({ success: true, data: inventory });
    } catch (error) {
      console.error('Error in getInventory:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  updateInventory = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;
      
      const inventory = await this.repository.updateInventory(tenantId, id, req.body);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory record not found' });
      }
      
      res.json({ success: true, data: inventory });
    } catch (error) {
      console.error('Error in updateInventory:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== MOVIMENTAÇÕES DE ESTOQUE ====================
  
  getStockMovements = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { itemId, limit } = req.query;
      
      const movements = await this.repository.getStockMovements(
        tenantId, 
        itemId as string, 
        limit ? parseInt(limit as string) : 50
      );
      res.json({ success: true, data: movements });
    } catch (error) {
      console.error('Error in getStockMovements:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  createStockMovement = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: userId } = req.user as any;
      
      const validatedData = insertStockMovementSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId
      });
      
      const movement = await this.repository.createStockMovement(validatedData);
      res.status(201).json({ success: true, data: movement });
    } catch (error) {
      console.error('Error in createStockMovement:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== KITS DE SERVIÇO ====================
  
  getServiceKits = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      
      const kits = await this.repository.getServiceKits(tenantId);
      res.json({ success: true, data: kits });
    } catch (error) {
      console.error('Error in getServiceKits:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  createServiceKit = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: userId } = req.user as any;
      
      const validatedData = insertServiceKitSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId
      });
      
      const kit = await this.repository.createServiceKit(validatedData);
      res.status(201).json({ success: true, data: kit });
    } catch (error) {
      console.error('Error in createServiceKit:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== LISTAS DE PREÇOS ====================
  
  getPriceLists = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      
      const priceLists = await this.repository.getPriceLists(tenantId);
      res.json({ success: true, data: priceLists });
    } catch (error) {
      console.error('Error in getPriceLists:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  createPriceList = async (req: Request, res: Response) => {
    try {
      const { tenantId, id: userId } = req.user as any;
      
      const validatedData = insertPriceListSchema.parse({
        ...req.body,
        tenantId,
        createdById: userId
      });
      
      const priceList = await this.repository.createPriceList(validatedData);
      res.status(201).json({ success: true, data: priceList });
    } catch (error) {
      console.error('Error in createPriceList:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== ATIVOS ====================
  
  getAssets = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      const { customerCompanyId } = req.query;
      
      const assets = await this.repository.getAssets(tenantId, customerCompanyId as string);
      res.json({ success: true, data: assets });
    } catch (error) {
      console.error('Error in getAssets:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  createAsset = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      
      const validatedData = insertAssetSchema.parse({
        ...req.body,
        tenantId
      });
      
      const asset = await this.repository.createAsset(validatedData);
      res.status(201).json({ success: true, data: asset });
    } catch (error) {
      console.error('Error in createAsset:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // ==================== DASHBOARD ====================
  
  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.user as any;
      
      const stats = await this.repository.getDashboardStats(tenantId);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}
