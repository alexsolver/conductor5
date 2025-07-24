import { Request, Response } from 'express';
import { completePartsServicesRepository } from '../../infrastructure/repositories/CompletePartsServicesRepository';
import { 
  insertItemSchema,
  insertItemAttachmentSchema,
  insertItemLinkSchema,
  insertItemCustomerLinkSchema,
  insertSupplierSchema,
  insertItemSupplierLinkSchema,
  insertStockLocationSchema,
  insertStockMovementSchema,
  insertStockReservationSchema,
  insertServiceKitSchema,
  insertServiceKitItemSchema,
  insertPriceListSchema,
  insertAssetSchema,
  insertAssetMovementSchema
} from '@shared/schema-parts-services-complete';

export class CompletePartsServicesController {
  
  // ==============================================
  // ITEMS - ENDPOINTS COMPLETOS
  // ==============================================
  
  async getAllItems(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { search, type, category, isActive } = req.query;
      
      const filters = {
        search: search as string,
        type: type as string,
        category: category as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };
      
      const items = await completePartsServicesRepository.getAllItems(tenantId, filters);
      res.json({ items });
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  }
  
  async createItem(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const validatedData = insertItemSchema.parse(req.body);
      
      const newItem = await completePartsServicesRepository.createItem(tenantId, validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  }
  
  async updateItem(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;
      const validatedData = insertItemSchema.partial().parse(req.body);
      
      const updatedItem = await completePartsServicesRepository.updateItem(id, tenantId, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ error: 'Failed to update item' });
    }
  }
  
  async deleteItem(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;
      
      const success = await completePartsServicesRepository.deleteItem(id, tenantId);
      
      if (!success) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  }
  
  // ==============================================
  // ANEXOS DE ITENS
  // ==============================================
  
  async addItemAttachment(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const validatedData = insertItemAttachmentSchema.parse(req.body);
      
      const attachment = await completePartsServicesRepository.addItemAttachment(itemId, validatedData);
      res.status(201).json(attachment);
    } catch (error) {
      console.error('Error adding attachment:', error);
      res.status(500).json({ error: 'Failed to add attachment' });
    }
  }
  
  async getItemAttachments(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      
      const attachments = await completePartsServicesRepository.getItemAttachments(itemId);
      res.json({ attachments });
    } catch (error) {
      console.error('Error fetching attachments:', error);
      res.status(500).json({ error: 'Failed to fetch attachments' });
    }
  }
  
  async deleteItemAttachment(req: Request, res: Response) {
    try {
      const { attachmentId } = req.params;
      
      const success = await completePartsServicesRepository.deleteItemAttachment(attachmentId);
      
      if (!success) {
        return res.status(404).json({ error: 'Attachment not found' });
      }
      
      res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ error: 'Failed to delete attachment' });
    }
  }
  
  // ==============================================
  // VÍNCULOS ENTRE ITENS
  // ==============================================
  
  async createItemLink(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { childItemId, linkType, quantity } = req.body;
      
      const link = await completePartsServicesRepository.createItemLink(itemId, childItemId, {
        linkType,
        quantity,
      });
      
      res.status(201).json(link);
    } catch (error) {
      console.error('Error creating item link:', error);
      res.status(500).json({ error: 'Failed to create item link' });
    }
  }
  
  async getItemLinks(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      
      const links = await completePartsServicesRepository.getItemLinks(itemId);
      res.json({ links });
    } catch (error) {
      console.error('Error fetching item links:', error);
      res.status(500).json({ error: 'Failed to fetch item links' });
    }
  }
  
  async deleteItemLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      
      const success = await completePartsServicesRepository.deleteItemLink(linkId);
      
      if (!success) {
        return res.status(404).json({ error: 'Link not found' });
      }
      
      res.json({ message: 'Link deleted successfully' });
    } catch (error) {
      console.error('Error deleting item link:', error);
      res.status(500).json({ error: 'Failed to delete item link' });
    }
  }
  
  // ==============================================
  // VÍNCULOS COM CLIENTES
  // ==============================================
  
  async createItemCustomerLink(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { customerId, nickname, sku, barcode, qrCode, isAsset } = req.body;
      
      const link = await completePartsServicesRepository.createItemCustomerLink(itemId, customerId, {
        nickname,
        sku,
        barcode,
        qrCode,
        isAsset,
      });
      
      res.status(201).json(link);
    } catch (error) {
      console.error('Error creating customer link:', error);
      res.status(500).json({ error: 'Failed to create customer link' });
    }
  }
  
  async getItemCustomerLinks(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      
      const links = await completePartsServicesRepository.getItemCustomerLinks(itemId);
      res.json({ links });
    } catch (error) {
      console.error('Error fetching customer links:', error);
      res.status(500).json({ error: 'Failed to fetch customer links' });
    }
  }
  
  async updateItemCustomerLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const validatedData = insertItemCustomerLinkSchema.partial().parse(req.body);
      
      const updatedLink = await completePartsServicesRepository.updateItemCustomerLink(linkId, validatedData);
      
      if (!updatedLink) {
        return res.status(404).json({ error: 'Customer link not found' });
      }
      
      res.json(updatedLink);
    } catch (error) {
      console.error('Error updating customer link:', error);
      res.status(500).json({ error: 'Failed to update customer link' });
    }
  }
  
  async deleteItemCustomerLink(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      
      const success = await completePartsServicesRepository.deleteItemCustomerLink(linkId);
      
      if (!success) {
        return res.status(404).json({ error: 'Customer link not found' });
      }
      
      res.json({ message: 'Customer link deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer link:', error);
      res.status(500).json({ error: 'Failed to delete customer link' });
    }
  }
  
  // ==============================================
  // VÍNCULOS COM FORNECEDORES
  // ==============================================
  
  async createItemSupplierLink(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { supplierId, partNumber, supplierDescription, supplierQrCode, supplierBarcode, leadTimeDays, minimumOrderQty } = req.body;
      
      const link = await completePartsServicesRepository.createItemSupplierLink(itemId, supplierId, {
        partNumber,
        supplierDescription,
        supplierQrCode,
        supplierBarcode,
        leadTimeDays,
        minimumOrderQty,
      });
      
      res.status(201).json(link);
    } catch (error) {
      console.error('Error creating supplier link:', error);
      res.status(500).json({ error: 'Failed to create supplier link' });
    }
  }
  
  async getItemSupplierLinks(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      
      const links = await completePartsServicesRepository.getItemSupplierLinks(itemId);
      res.json({ links });
    } catch (error) {
      console.error('Error fetching supplier links:', error);
      res.status(500).json({ error: 'Failed to fetch supplier links' });
    }
  }
  
  // ==============================================
  // CONTROLE DE ESTOQUE AVANÇADO
  // ==============================================
  
  async getAllStockLocations(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      
      const locations = await completePartsServicesRepository.getAllStockLocations(tenantId);
      res.json({ locations });
    } catch (error) {
      console.error('Error fetching stock locations:', error);
      res.status(500).json({ error: 'Failed to fetch stock locations' });
    }
  }
  
  async createStockLocation(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const validatedData = insertStockLocationSchema.parse(req.body);
      
      const location = await completePartsServicesRepository.createStockLocation(tenantId, validatedData);
      res.status(201).json(location);
    } catch (error) {
      console.error('Error creating stock location:', error);
      res.status(500).json({ error: 'Failed to create stock location' });
    }
  }
  
  async getStockLevels(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { locationId, itemId, lowStock } = req.query;
      
      const filters = {
        locationId: locationId as string,
        itemId: itemId as string,
        lowStock: lowStock === 'true',
      };
      
      const levels = await completePartsServicesRepository.getStockLevels(tenantId, filters);
      res.json({ levels });
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      res.status(500).json({ error: 'Failed to fetch stock levels' });
    }
  }
  
  async createStockMovement(req: Request, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      const validatedData = insertStockMovementSchema.parse({
        ...req.body,
        userId,
      });
      
      const movement = await completePartsServicesRepository.createStockMovement(tenantId, validatedData);
      res.status(201).json(movement);
    } catch (error) {
      console.error('Error creating stock movement:', error);
      res.status(500).json({ error: 'Failed to create stock movement' });
    }
  }
  
  async getStockMovements(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { itemId, locationId, movementType, limit } = req.query;
      
      const filters = {
        itemId: itemId as string,
        locationId: locationId as string,
        movementType: movementType as string,
        limit: limit ? parseInt(limit as string) : undefined,
      };
      
      const movements = await completePartsServicesRepository.getStockMovements(tenantId, filters);
      res.json({ movements });
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
  }
  
  // ==============================================
  // RESERVAS DE ESTOQUE
  // ==============================================
  
  async createStockReservation(req: Request, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      const validatedData = insertStockReservationSchema.parse({
        ...req.body,
        userId,
      });
      
      const reservation = await completePartsServicesRepository.createStockReservation(tenantId, validatedData);
      res.status(201).json(reservation);
    } catch (error) {
      console.error('Error creating stock reservation:', error);
      res.status(500).json({ error: 'Failed to create stock reservation' });
    }
  }
  
  async getActiveReservations(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { itemId } = req.query;
      
      const reservations = await completePartsServicesRepository.getActiveReservations(tenantId, itemId as string);
      res.json({ reservations });
    } catch (error) {
      console.error('Error fetching reservations:', error);
      res.status(500).json({ error: 'Failed to fetch reservations' });
    }
  }
  
  // ==============================================
  // KITS DE SERVIÇO
  // ==============================================
  
  async getAllServiceKits(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      
      const kits = await completePartsServicesRepository.getAllServiceKits(tenantId);
      res.json({ kits });
    } catch (error) {
      console.error('Error fetching service kits:', error);
      res.status(500).json({ error: 'Failed to fetch service kits' });
    }
  }
  
  async createServiceKit(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const validatedData = insertServiceKitSchema.parse(req.body);
      
      const kit = await completePartsServicesRepository.createServiceKit(tenantId, validatedData);
      res.status(201).json(kit);
    } catch (error) {
      console.error('Error creating service kit:', error);
      res.status(500).json({ error: 'Failed to create service kit' });
    }
  }
  
  async getServiceKitWithItems(req: Request, res: Response) {
    try {
      const { kitId } = req.params;
      
      const kit = await completePartsServicesRepository.getServiceKitWithItems(kitId);
      
      if (!kit) {
        return res.status(404).json({ error: 'Service kit not found' });
      }
      
      res.json(kit);
    } catch (error) {
      console.error('Error fetching service kit:', error);
      res.status(500).json({ error: 'Failed to fetch service kit' });
    }
  }
  
  async addItemToServiceKit(req: Request, res: Response) {
    try {
      const { kitId } = req.params;
      const { itemId, quantity, isOptional, notes } = req.body;
      
      const kitItem = await completePartsServicesRepository.addItemToServiceKit(kitId, itemId, quantity, isOptional, notes);
      res.status(201).json(kitItem);
    } catch (error) {
      console.error('Error adding item to kit:', error);
      res.status(500).json({ error: 'Failed to add item to kit' });
    }
  }
  
  // ==============================================
  // LISTAS DE PREÇOS
  // ==============================================
  
  async getAllPriceLists(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      
      const priceLists = await completePartsServicesRepository.getAllPriceLists(tenantId);
      res.json({ priceLists });
    } catch (error) {
      console.error('Error fetching price lists:', error);
      res.status(500).json({ error: 'Failed to fetch price lists' });
    }
  }
  
  async createPriceList(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const validatedData = insertPriceListSchema.parse(req.body);
      
      const priceList = await completePartsServicesRepository.createPriceList(tenantId, validatedData);
      res.status(201).json(priceList);
    } catch (error) {
      console.error('Error creating price list:', error);
      res.status(500).json({ error: 'Failed to create price list' });
    }
  }
  
  async getPriceListWithItems(req: Request, res: Response) {
    try {
      const { priceListId } = req.params;
      
      const priceList = await completePartsServicesRepository.getPriceListWithItems(priceListId);
      
      if (!priceList) {
        return res.status(404).json({ error: 'Price list not found' });
      }
      
      res.json(priceList);
    } catch (error) {
      console.error('Error fetching price list:', error);
      res.status(500).json({ error: 'Failed to fetch price list' });
    }
  }
  
  // ==============================================
  // CONTROLE DE ATIVOS
  // ==============================================
  
  async getAllAssets(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { search, status, category } = req.query;
      
      const filters = {
        search: search as string,
        status: status as string,
        category: category as string,
      };
      
      const assets = await completePartsServicesRepository.getAllAssets(tenantId, filters);
      res.json({ assets });
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Failed to fetch assets' });
    }
  }
  
  async createAsset(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const validatedData = insertAssetSchema.parse(req.body);
      
      const asset = await completePartsServicesRepository.createAsset(tenantId, validatedData);
      res.status(201).json(asset);
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ error: 'Failed to create asset' });
    }
  }
  
  async getAssetHierarchy(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      
      const asset = await completePartsServicesRepository.getAssetHierarchy(assetId);
      
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      res.json(asset);
    } catch (error) {
      console.error('Error fetching asset hierarchy:', error);
      res.status(500).json({ error: 'Failed to fetch asset hierarchy' });
    }
  }
  
  async recordAssetMovement(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const { userId } = req.user!;
      const validatedData = insertAssetMovementSchema.parse({
        ...req.body,
        authorizedBy: userId,
      });
      
      const movement = await completePartsServicesRepository.recordAssetMovement(assetId, validatedData);
      res.status(201).json(movement);
    } catch (error) {
      console.error('Error recording asset movement:', error);
      res.status(500).json({ error: 'Failed to record asset movement' });
    }
  }
  
  // ==============================================
  // DASHBOARD E ESTATÍSTICAS
  // ==============================================
  
  async getDashboardStats(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      
      const stats = await completePartsServicesRepository.getDashboardStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }
}

export const completePartsServicesController = new CompletePartsServicesController();