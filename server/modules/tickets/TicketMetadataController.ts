/**
 * TicketMetadataController - API endpoints for ticket metadata management
 * Handles CRUD operations for field configurations, options, styles, and defaults
 */

import { Request, Response } from "express";
import { TicketMetadataRepository } from "./TicketMetadataRepository";
import { z } from "zod";
import { 
  insertTicketFieldConfigurationSchema, 
  insertTicketFieldOptionSchema,
  insertTicketStyleConfigurationSchema,
  insertTicketDefaultConfigurationSchema
} from "@shared/schema";

const metadataRepo = new TicketMetadataRepository();

// Validation schemas
const fieldConfigSchema = insertTicketFieldConfigurationSchema.omit({ id: true, createdAt: true, updatedAt: true });
const fieldOptionSchema = insertTicketFieldOptionSchema.omit({ id: true, createdAt: true });
const styleConfigSchema = insertTicketStyleConfigurationSchema.omit({ id: true, createdAt: true });
const defaultConfigSchema = insertTicketDefaultConfigurationSchema.omit({ id: true, createdAt: true });

export class TicketMetadataController {

  // ===========================
  // FIELD CONFIGURATIONS
  // ===========================

  async getFieldConfigurations(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const configurations = await metadataRepo.getFieldConfigurations(tenantId);
      
      // Include options for each configuration
      const configurationsWithOptions = await Promise.all(
        configurations.map(async (config) => {
          const options = await metadataRepo.getFieldOptions(tenantId, config.fieldName);
          return { ...config, options };
        })
      );

      res.json({ configurations: configurationsWithOptions });
    } catch (error) {
      console.error("Error getting field configurations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getFieldConfiguration(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { fieldName } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const configuration = await metadataRepo.getFieldConfiguration(tenantId, fieldName);
      if (!configuration) {
        return res.status(404).json({ message: "Field configuration not found" });
      }

      const options = await metadataRepo.getFieldOptions(tenantId, fieldName);
      res.json({ configuration: { ...configuration, options } });
    } catch (error) {
      console.error("Error getting field configuration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async createFieldConfiguration(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const validatedData = fieldConfigSchema.parse({ ...req.body, tenantId });
      const created = await metadataRepo.createFieldConfiguration(validatedData);
      
      res.status(201).json({ configuration: created });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating field configuration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateFieldConfiguration(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { fieldName } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const updated = await metadataRepo.updateFieldConfiguration(tenantId, fieldName, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Field configuration not found" });
      }

      res.json({ configuration: updated });
    } catch (error) {
      console.error("Error updating field configuration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ===========================
  // FIELD OPTIONS
  // ===========================

  async getFieldOptions(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { fieldName } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const options = await metadataRepo.getFieldOptions(tenantId, fieldName);
      res.json({ options });
    } catch (error) {
      console.error("Error getting field options:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async createFieldOption(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { fieldName } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      // Get field configuration to get the fieldConfigId
      const fieldConfig = await metadataRepo.getFieldConfiguration(tenantId, fieldName);
      if (!fieldConfig) {
        return res.status(404).json({ message: "Field configuration not found" });
      }

      const validatedData = fieldOptionSchema.parse({
        ...req.body,
        tenantId,
        fieldConfigId: fieldConfig.id
      });

      const created = await metadataRepo.createFieldOption(validatedData);
      res.status(201).json({ option: created });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating field option:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateFieldOption(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { optionId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const updated = await metadataRepo.updateFieldOption(tenantId, optionId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Field option not found" });
      }

      res.json({ option: updated });
    } catch (error) {
      console.error("Error updating field option:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteFieldOption(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { optionId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      await metadataRepo.deleteFieldOption(tenantId, optionId);
      res.json({ success: true, message: "Field option deleted" });
    } catch (error) {
      console.error("Error deleting field option:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ===========================
  // STYLE CONFIGURATIONS
  // ===========================

  async getStyleConfigurations(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const styles = await metadataRepo.getStyleConfigurations(tenantId);
      res.json({ styles });
    } catch (error) {
      console.error("Error getting style configurations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getStyleConfiguration(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { fieldName } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const style = await metadataRepo.getStyleConfiguration(tenantId, fieldName);
      if (!style) {
        return res.status(404).json({ message: "Style configuration not found" });
      }

      res.json({ style });
    } catch (error) {
      console.error("Error getting style configuration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async createStyleConfiguration(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const validatedData = styleConfigSchema.parse({ ...req.body, tenantId });
      const created = await metadataRepo.createStyleConfiguration(validatedData);
      
      res.status(201).json({ style: created });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating style configuration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateStyleConfiguration(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { fieldName } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const updated = await metadataRepo.updateStyleConfiguration(tenantId, fieldName, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Style configuration not found" });
      }

      res.json({ style: updated });
    } catch (error) {
      console.error("Error updating style configuration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ===========================
  // DEFAULT CONFIGURATIONS
  // ===========================

  async getDefaultConfigurations(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const defaults = await metadataRepo.getDefaultConfigurations(tenantId);
      res.json({ defaults });
    } catch (error) {
      console.error("Error getting default configurations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateDefaultConfiguration(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { fieldName } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const existing = await metadataRepo.getDefaultConfiguration(tenantId, fieldName);
      
      if (existing) {
        const updated = await metadataRepo.updateDefaultConfiguration(tenantId, fieldName, req.body);
        res.json({ default: updated });
      } else {
        const validatedData = defaultConfigSchema.parse({ ...req.body, tenantId, fieldName });
        const created = await metadataRepo.createDefaultConfiguration(validatedData);
        res.status(201).json({ default: created });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating default configuration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // ===========================
  // UTILITY ENDPOINTS
  // ===========================

  async initializeDefaults(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const result = await metadataRepo.initializeDefaultConfigurations(tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error initializing defaults:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async generateDynamicSchema(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: "Tenant ID required" });
      }

      const configurations = await metadataRepo.getFieldConfigurations(tenantId);
      const schema: any = {};

      for (const config of configurations) {
        if (config.fieldType === 'select') {
          const options = await metadataRepo.getFieldOptions(tenantId, config.fieldName);
          const values = options.map(opt => opt.optionValue);
          
          schema[config.fieldName] = {
            type: 'enum',
            values,
            required: config.isRequired,
            default: options.find(opt => opt.isDefault)?.optionValue
          };
        }
      }

      res.json({ schema });
    } catch (error) {
      console.error("Error generating dynamic schema:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}