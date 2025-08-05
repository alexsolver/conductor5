
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';
import { ItemRepository } from '../../infrastructure/repositories/ItemRepository';
import { db } from '../../../../db';

export class ItemCustomerLinksController {
  private itemRepository: ItemRepository;

  constructor() {
    this.itemRepository = new ItemRepository(db);
  }

  async getItemCustomerLinks(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tenant ID is required' 
        });
      }

      const links = await this.itemRepository.getCustomerLinks(itemId, tenantId);

      res.json({
        success: true,
        message: 'Item customer links retrieved successfully',
        data: { links }
      });
    } catch (error) {
      console.error('Error getting item customer links:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve item customer links',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createItemCustomerLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tenant ID is required' 
        });
      }

      const { customerId, alias, sku, barcode, qrCode, isAsset } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
      }

      const linkData = {
        tenantId,
        itemId,
        customerId,
        alias,
        sku,
        barcode,
        qrCode,
        isAsset: isAsset || false,
        createdBy: userId
      };

      const link = await this.itemRepository.addCustomerLink(linkData);

      res.status(201).json({
        success: true,
        message: 'Item customer link created successfully',
        data: { link }
      });
    } catch (error) {
      console.error('Error creating item customer link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create item customer link',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateItemCustomerLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId, linkId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tenant ID is required' 
        });
      }

      const { alias, sku, barcode, qrCode, isAsset } = req.body;

      const updatedLink = await this.itemRepository.updateCustomerLink(linkId, {
        alias,
        sku,
        barcode,
        qrCode,
        isAsset
      });

      if (!updatedLink) {
        return res.status(404).json({
          success: false,
          message: 'Item customer link not found'
        });
      }

      res.json({
        success: true,
        message: 'Item customer link updated successfully',
        data: { link: updatedLink }
      });
    } catch (error) {
      console.error('Error updating item customer link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update item customer link',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteItemCustomerLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId, linkId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tenant ID is required' 
        });
      }

      const deleted = await this.itemRepository.deleteCustomerLink(linkId, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Item customer link not found'
        });
      }

      res.json({
        success: true,
        message: 'Item customer link deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting item customer link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete item customer link',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
