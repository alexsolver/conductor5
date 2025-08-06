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
        active,
        companyId
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        search: search as string,
        type: type as string,
        status: status as string,
        active: active === 'true' ? true : active === 'false' ? false : undefined,
        companyId: companyId as string
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

      // Direct SQL query to avoid Drizzle ORM issues  
      const { pool } = await import('../../../../db.js');
      
      // Get main item data
      const itemQuery = `
        SELECT 
          id, name, type, integration_code, description, 
          measurement_unit, maintenance_plan, default_checklist,
          status, active, created_at, updated_at, tenant_id
        FROM tenant_${tenantId.replace(/-/g, '_')}.items 
        WHERE id = $1 AND tenant_id = $2 AND active = true
      `;
      const itemResult = await pool.query(itemQuery, [id, tenantId]);
      
      if (itemResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      const item = itemResult.rows[0];

      // Get attachments, customer links, and supplier links with safe queries
      const [attachments, customerLinks, supplierLinks] = await Promise.all([
        // Attachments
        pool.query(`
          SELECT * FROM tenant_${tenantId.replace(/-/g, '_')}.item_attachments 
          WHERE item_id = $1 ORDER BY created_at DESC
        `, [id]).catch(() => ({ rows: [] })),
        
        // Customer personalizations
        pool.query(`
          SELECT m.*, c.company as customer_name
          FROM tenant_${tenantId.replace(/-/g, '_')}.customer_item_mappings m
          LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.customers c ON m.customer_id = c.id  
          WHERE m.item_id = $1 AND m.is_active = true
          ORDER BY m.created_at DESC
        `, [id]).catch(() => ({ rows: [] })),
        
        // Supplier links
        pool.query(`
          SELECT l.*, s.name as supplier_name
          FROM tenant_${tenantId.replace(/-/g, '_')}.supplier_item_links l
          LEFT JOIN tenant_${tenantId.replace(/-/g, '_')}.suppliers s ON l.supplier_id = s.id
          WHERE l.item_id = $1 AND l.is_active = true
          ORDER BY l.created_at DESC
        `, [id]).catch(() => ({ rows: [] }))
      ]);

      res.json({
        success: true,
        data: {
          ...item,
          attachments: attachments.rows || [],
          links: {
            customers: customerLinks.rows || [],
            suppliers: supplierLinks.rows || []
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

      // Separar vínculos dos dados básicos do item
      const { linkedCustomers, linkedItems, linkedSuppliers, ...itemData } = req.body;
      
      const updateData = {
        ...itemData,
        updatedBy: req.user?.id
      };

      const item = await this.itemRepository.update(id, tenantId, updateData);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // 🔧 CORREÇÃO: Processar vínculos se fornecidos
      if (linkedCustomers || linkedItems || linkedSuppliers) {
        await this.itemRepository.updateItemLinks(id, tenantId, {
          customers: linkedCustomers || [],
          items: linkedItems || [],
          suppliers: linkedSuppliers || []
        }, req.user?.id);
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