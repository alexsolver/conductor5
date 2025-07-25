import { Request, Response } from 'express';
import { ItemRepository } from '../../infrastructure/repositories/ItemRepository';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
}

export class ItemController {
  constructor(private itemRepository: ItemRepository) {}

  async createItem(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const itemData = {
        ...req.body,
        tenantId,
        createdBy: req.user?.id
      };

      const item = await this.itemRepository.create(itemData);
      
      res.status(201).json({
        success: true,
        data: item,
        message: 'Item created successfully'
      });
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create item'
      });
    }
  }

  async getItems(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const {
        limit = 50,
        offset = 0,
        search,
        type,
        status,
        active
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        search: search as string,
        type: type as string,
        status: status as string,
        active: active === 'true' ? true : active === 'false' ? false : undefined
      };

      const items = await this.itemRepository.findByTenant(tenantId, options);
      
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch items'
      });
    }
  }

  async getItem(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const item = await this.itemRepository.findById(id, tenantId);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // Get attachments and links
      const [attachments, itemLinks, customerLinks, supplierLinks] = await Promise.all([
        this.itemRepository.getAttachments(id, tenantId),
        this.itemRepository.getItemLinks(id, tenantId),
        this.itemRepository.getCustomerLinks(id, tenantId),
        this.itemRepository.getSupplierLinks(id, tenantId)
      ]);

      res.json({
        success: true,
        data: {
          ...item,
          attachments,
          links: {
            items: itemLinks,
            customers: customerLinks,
            suppliers: supplierLinks
          }
        }
      });
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch item'
      });
    }
  }

  async updateItem(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user?.id
      };

      const item = await this.itemRepository.update(id, tenantId, updateData);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      res.json({
        success: true,
        data: item,
        message: 'Item updated successfully'
      });
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update item'
      });
    }
  }

  async deleteItem(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const deleted = await this.itemRepository.delete(id, tenantId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      res.json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete item'
      });
    }
  }

  async addAttachment(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const attachmentData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const attachment = await this.itemRepository.addAttachment(id, tenantId, attachmentData);
      
      res.status(201).json({
        success: true,
        data: attachment,
        message: 'Attachment added successfully'
      });
    } catch (error) {
      console.error('Error adding attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add attachment'
      });
    }
  }

  async addLink(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const linkData = {
        ...req.body,
        tenantId,
        parentItemId: id,
        createdBy: req.user?.id
      };

      const { linkType, ...otherData } = linkData;
      
      let link;
      switch(linkType) {
        case 'item_item':
          link = await this.itemRepository.addItemLink({
            tenantId,
            itemId: id,
            linkedItemId: otherData.linkedItemId!,
            relationship: otherData.relationship!,
            createdBy: req.user?.id
          });
          break;
        case 'item_customer':
          link = await this.itemRepository.addCustomerLink({
            tenantId,
            itemId: id,
            customerId: otherData.customerId!,
            alias: otherData.alias,
            sku: otherData.sku,
            barcode: otherData.barcode,
            qrCode: otherData.qrCode,
            isAsset: otherData.isAsset,
            createdBy: req.user?.id
          });
          break;
        case 'item_supplier':
          link = await this.itemRepository.addSupplierLink({
            tenantId,
            itemId: id,
            supplierId: otherData.supplierId!,
            partNumber: otherData.partNumber,
            description: otherData.description,
            qrCode: otherData.qrCode,
            barcode: otherData.barcode,
            unitPrice: otherData.unitPrice,
            createdBy: req.user?.id
          });
          break;
        default:
          throw new Error('Invalid link type');
      }
      
      res.status(201).json({
        success: true,
        data: link,
        message: 'Link added successfully'
      });
    } catch (error) {
      console.error('Error adding link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add link'
      });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      const stats = await this.itemRepository.getStats(tenantId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stats'
      });
    }
  }
}