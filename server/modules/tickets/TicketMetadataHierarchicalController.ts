/**
 * TICKET METADATA HIERARCHICAL CONTROLLER
 * API endpoints for managing hierarchical ticket configurations per customer company
 */

import { Request, Response } from "express";
import { ticketMetadataHierarchicalService } from "./TicketMetadataHierarchicalService";
import { AuthenticatedRequest } from "../../middleware/auth";

export class TicketMetadataHierarchicalController {

  /**
   * GET HIERARCHICAL CONFIGURATION FOR CUSTOMER
   * Returns complete configuration showing inheritance (customer → tenant → system)
   */
  async getCustomerConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const tenantId = req.user.tenantId;

      if (!customerId) {
        return res.status(400).json({ 
          error: "Customer ID is required" 
        });
      }

      const configuration = await ticketMetadataHierarchicalService
        .getCustomerCompleteConfiguration(tenantId, customerId);

      res.json({
        success: true,
        customerId,
        tenantId,
        configuration,
        metadata: {
          timestamp: new Date().toISOString(),
          resolutionInfo: "Shows source of each configuration: customer-specific, tenant-global, or system-default"
        }
      });

    } catch (error) {
      console.error("Error getting customer configuration:", error);
      res.status(500).json({ 
        error: "Failed to get customer configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * RESOLVE SPECIFIC FIELD FOR CUSTOMER
   * Shows hierarchical resolution in action for a specific field
   */
  async resolveFieldForCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId, fieldName } = req.params;
      const tenantId = req.user.tenantId;

      const fieldConfig = await ticketMetadataHierarchicalService
        .resolveFieldConfiguration(tenantId, customerId, fieldName);
      
      const fieldOptions = await ticketMetadataHierarchicalService
        .resolveFieldOptions(tenantId, customerId, fieldName);

      res.json({
        success: true,
        hierarchicalResolution: {
          tenantId,
          customerId,
          fieldName,
          resolvedConfiguration: fieldConfig,
          resolvedOptions: fieldOptions,
          resolutionPath: {
            configurationSource: fieldConfig?.source || "none",
            optionsSource: fieldOptions.length > 0 ? fieldOptions[0].source : "none",
            description: "customer → tenant → system"
          }
        }
      });

    } catch (error) {
      console.error("Error resolving field for customer:", error);
      res.status(500).json({ 
        error: "Failed to resolve field for customer",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * CREATE CUSTOMER-SPECIFIC CONFIGURATION
   * Allows creating configurations specific to a customer company
   */
  async createCustomerSpecificConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const { fieldName, displayName, options } = req.body;
      const tenantId = req.user.tenantId;

      // Validate input
      if (!customerId || !fieldName || !displayName || !options || !Array.isArray(options)) {
        return res.status(400).json({ 
          error: "customerId, fieldName, displayName, and options array are required" 
        });
      }

      const result = await ticketMetadataHierarchicalService
        .createCustomerSpecificConfiguration(tenantId, customerId, fieldName, {
          displayName,
          options
        });

      res.status(201).json({
        success: true,
        message: `Customer-specific ${fieldName} configuration created successfully`,
        created: {
          fieldConfiguration: result.fieldConfiguration,
          fieldOptions: result.fieldOptions,
          customerId,
          fieldName
        }
      });

    } catch (error) {
      console.error("Error creating customer-specific configuration:", error);
      res.status(500).json({ 
        error: "Failed to create customer-specific configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * DEMONSTRATE HIERARCHICAL SYSTEM WITH PRACTICAL EXAMPLES
   * Creates example configurations for different customer companies
   */
  async createPracticalExamples(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user.tenantId;

      // Example 1: Tech Company with P1-P4 Priorities
      const techCompanyResult = await ticketMetadataHierarchicalService
        .createCustomerSpecificConfiguration(tenantId, "tech-company-uuid", "priority", {
          displayName: "Tech Priority",
          options: [
            { value: "p1", label: "P1 - Critical", color: "#DC2626", isDefault: false },
            { value: "p2", label: "P2 - High", color: "#EA580C", isDefault: false },
            { value: "p3", label: "P3 - Medium", color: "#CA8A04", isDefault: true },
            { value: "p4", label: "P4 - Low", color: "#16A34A", isDefault: false }
          ]
        });

      // Example 2: Healthcare Company with Severity Levels
      const healthcareResult = await ticketMetadataHierarchicalService
        .createCustomerSpecificConfiguration(tenantId, "healthcare-company-uuid", "priority", {
          displayName: "Severidade Médica",
          options: [
            { value: "emergencial", label: "Emergencial", color: "#B91C1C", isDefault: false },
            { value: "urgente", label: "Urgente", color: "#DC2626", isDefault: false },
            { value: "moderado", label: "Moderado", color: "#D97706", isDefault: true },
            { value: "eletivo", label: "Eletivo", color: "#059669", isDefault: false }
          ]
        });

      // Example 3: Financial Company with Risk Categories
      const financialResult = await ticketMetadataHierarchicalService
        .createCustomerSpecificConfiguration(tenantId, "financial-company-uuid", "priority", {
          displayName: "Categoria de Risco",
          options: [
            { value: "alto_risco", label: "Alto Risco", color: "#991B1B", isDefault: false },
            { value: "medio_risco", label: "Médio Risco", color: "#B45309", isDefault: true },
            { value: "baixo_risco", label: "Baixo Risco", color: "#047857", isDefault: false },
            { value: "sem_risco", label: "Sem Risco", color: "#1F2937", isDefault: false }
          ]
        });

      res.status(201).json({
        success: true,
        message: "Practical examples created successfully",
        examples: [
          {
            company: "Tech Company",
            customerId: "tech-company-uuid",
            field: "priority",
            style: "P1-P4 Format",
            configuration: techCompanyResult
          },
          {
            company: "Healthcare Company",
            customerId: "healthcare-company-uuid",
            field: "priority",
            style: "Medical Severity",
            configuration: healthcareResult
          },
          {
            company: "Financial Company",
            customerId: "financial-company-uuid",
            field: "priority",
            style: "Risk Categories",
            configuration: financialResult
          }
        ],
        usage: {
          instructions: "Use the customer IDs to test hierarchical resolution",
          testEndpoints: [
            `GET /api/ticket-metadata-hierarchical/customer/{customerId}/configuration`,
            `GET /api/ticket-metadata-hierarchical/customer/{customerId}/field/{fieldName}`
          ]
        }
      });

    } catch (error) {
      console.error("Error creating practical examples:", error);
      res.status(500).json({ 
        error: "Failed to create practical examples",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * COMPARE CONFIGURATIONS BETWEEN CUSTOMERS
   * Shows how different customers get different configurations for the same field
   */
  async compareCustomerConfigurations(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerIds, fieldName } = req.body;
      const tenantId = req.user.tenantId;

      if (!customerIds || !Array.isArray(customerIds) || !fieldName) {
        return res.status(400).json({ 
          error: "customerIds array and fieldName are required" 
        });
      }

      const comparisons = await Promise.all(
        customerIds.map(async (customerId: string) => {
          const config = await ticketMetadataHierarchicalService
            .resolveFieldConfiguration(tenantId, customerId, fieldName);
          const options = await ticketMetadataHierarchicalService
            .resolveFieldOptions(tenantId, customerId, fieldName);
          
          return {
            customerId,
            configuration: config,
            options,
            source: config?.source || "none"
          };
        })
      );

      res.json({
        success: true,
        fieldName,
        comparison: comparisons,
        summary: {
          totalCustomers: customerIds.length,
          uniqueConfigurations: new Set(comparisons.map(c => c.source)).size,
          distributionBySources: comparisons.reduce((acc, comp) => {
            acc[comp.source] = (acc[comp.source] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      });

    } catch (error) {
      console.error("Error comparing customer configurations:", error);
      res.status(500).json({ 
        error: "Failed to compare customer configurations",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}

// Export singleton instance
export const ticketMetadataHierarchicalController = new TicketMetadataHierarchicalController();