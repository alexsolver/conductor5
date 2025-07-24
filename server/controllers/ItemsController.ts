import { Request, Response } from "express";
import { ItemsRepository } from "../repositories/ItemsRepository";
import {
  insertItemSchema,
  insertItemAttachmentSchema,
  insertItemLinkSchema,
  insertItemCustomerLinkSchema,
  insertItemSupplierLinkSchema,
  updateItemSchema,
  updateItemCustomerLinkSchema,
  updateItemSupplierLinkSchema,
} from "@shared/schema";
import { z } from "zod";

export class ItemsController {
  private itemsRepository: ItemsRepository;

  constructor() {
    this.itemsRepository = new ItemsRepository();
  }

  // Items CRUD
  async createItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = insertItemSchema.parse({
        ...req.body,
        tenantId,
      });

      const item = await this.itemsRepository.createItem({
        ...validatedData,
        createdById: userId,
      });

      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getItems(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const filters = {
        type: req.query.type as string,
        group: req.query.group as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string,
      };

      const items = await this.itemsRepository.getItems(tenantId, filters);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getItemById(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const item = await this.itemsRepository.getItemById(id, tenantId);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = updateItemSchema.parse(req.body);

      const item = await this.itemsRepository.updateItem(id, tenantId, {
        ...validatedData,
        updatedById: userId,
      });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteItem(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await this.itemsRepository.deleteItem(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Item Attachments
  async createItemAttachment(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { itemId } = req.params;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = insertItemAttachmentSchema.parse({
        ...req.body,
        tenantId,
        itemId,
      });

      const attachment = await this.itemsRepository.createItemAttachment({
        ...validatedData,
        createdById: userId,
      });

      res.status(201).json(attachment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating item attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getItemAttachments(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { itemId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const attachments = await this.itemsRepository.getItemAttachments(itemId, tenantId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching item attachments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteItemAttachment(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { attachmentId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await this.itemsRepository.deleteItemAttachment(attachmentId, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Item Links
  async createItemLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { itemId } = req.params;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = insertItemLinkSchema.parse({
        ...req.body,
        tenantId,
        parentItemId: itemId,
      });

      const link = await this.itemsRepository.createItemLink({
        ...validatedData,
        createdById: userId,
      });

      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating item link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getItemLinks(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { itemId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const links = await this.itemsRepository.getItemLinks(itemId, tenantId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching item links:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteItemLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { linkId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await this.itemsRepository.deleteItemLink(linkId, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Item Customer Links
  async createItemCustomerLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { itemId } = req.params;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = insertItemCustomerLinkSchema.parse({
        ...req.body,
        tenantId,
        itemId,
      });

      const link = await this.itemsRepository.createItemCustomerLink({
        ...validatedData,
        createdById: userId,
      });

      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating item customer link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getItemCustomerLinks(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { itemId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const links = await this.itemsRepository.getItemCustomerLinks(itemId, tenantId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching item customer links:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateItemCustomerLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { linkId } = req.params;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = updateItemCustomerLinkSchema.parse(req.body);

      const link = await this.itemsRepository.updateItemCustomerLink(linkId, tenantId, {
        ...validatedData,
        updatedById: userId,
      });

      if (!link) {
        return res.status(404).json({ error: "Item customer link not found" });
      }

      res.json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating item customer link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteItemCustomerLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { linkId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await this.itemsRepository.deleteItemCustomerLink(linkId, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item customer link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Item Supplier Links
  async createItemSupplierLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { itemId } = req.params;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = insertItemSupplierLinkSchema.parse({
        ...req.body,
        tenantId,
        itemId,
      });

      const link = await this.itemsRepository.createItemSupplierLink({
        ...validatedData,
        createdById: userId,
      });

      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating item supplier link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getItemSupplierLinks(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { itemId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const links = await this.itemsRepository.getItemSupplierLinks(itemId, tenantId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching item supplier links:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateItemSupplierLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { linkId } = req.params;

      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = updateItemSupplierLinkSchema.parse(req.body);

      const link = await this.itemsRepository.updateItemSupplierLink(linkId, tenantId, {
        ...validatedData,
        updatedById: userId,
      });

      if (!link) {
        return res.status(404).json({ error: "Item supplier link not found" });
      }

      res.json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating item supplier link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteItemSupplierLink(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { linkId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await this.itemsRepository.deleteItemSupplierLink(linkId, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item supplier link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Statistics
  async getItemsStats(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const stats = await this.itemsRepository.getItemsStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching items stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}