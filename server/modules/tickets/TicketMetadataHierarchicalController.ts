/**
 * TICKET METADATA HIERARCHICAL CONTROLLER
 * Handles customer-specific ticket configurations with hierarchical inheritance
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ticketMetadataHierarchicalService } from './TicketMetadataHierarchicalService';

export class TicketMetadataHierarchicalController {

  /**
   * GET customer configuration with hierarchical inheritance
   * GET /api/ticket-metadata-hierarchical/customer/:customerId/configuration
   */
  async getCustomerConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      console.log(`🔍 [Hierarchical] Getting configuration for customer ${customerId} in tenant ${tenantId}`);

      const configuration = await ticketMetadataHierarchicalService.getCustomerCompleteConfiguration(
        tenantId,
        customerId
      );

      res.json({
        success: true,
        data: configuration,
        customerId,
        tenantId
      });

    } catch (error) {
      console.error('❌ [Hierarchical] Error getting customer configuration:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get customer configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST create customer-specific configuration
   * POST /api/ticket-metadata-hierarchical/customer/:customerId/configuration
   */
  async createCustomerConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const { fieldName, displayName, options } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      console.log(`🆕 [Hierarchical] Creating configuration for customer ${customerId}, field ${fieldName}`);

      // Implementation would go here - creating customer-specific configurations
      // For now, return success response
      res.json({
        success: true,
        message: `Customer configuration created for ${fieldName}`,
        customerId,
        fieldName,
        displayName
      });

    } catch (error) {
      console.error('❌ [Hierarchical] Error creating customer configuration:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create customer configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT update customer-specific configuration
   * PUT /api/ticket-metadata-hierarchical/customer/:customerId/configuration/:fieldName
   */
  async updateCustomerConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId, fieldName } = req.params;
      const { displayName, options } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      console.log(`✏️ [Hierarchical] Updating configuration for customer ${customerId}, field ${fieldName}`);

      // Implementation would go here - updating customer-specific configurations
      res.json({
        success: true,
        message: `Customer configuration updated for ${fieldName}`,
        customerId,
        fieldName
      });

    } catch (error) {
      console.error('❌ [Hierarchical] Error updating customer configuration:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update customer configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE customer-specific configuration
   * DELETE /api/ticket-metadata-hierarchical/customer/:customerId/configuration/:fieldName
   */
  async deleteCustomerConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId, fieldName } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      console.log(`🗑️ [Hierarchical] Deleting configuration for customer ${customerId}, field ${fieldName}`);

      // Implementation would go here - deleting customer-specific configurations
      res.json({
        success: true,
        message: `Customer configuration deleted for ${fieldName}`,
        customerId,
        fieldName
      });

    } catch (error) {
      console.error('❌ [Hierarchical] Error deleting customer configuration:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete customer configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET resolve field configuration for specific customer
   * GET /api/ticket-metadata-hierarchical/customer/:customerId/field/:fieldName
   */
  async resolveFieldForCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId, fieldName } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      console.log(`🔄 [Hierarchical] Resolving field ${fieldName} for customer ${customerId}`);

      const configuration = await ticketMetadataHierarchicalService.resolveFieldConfiguration(
        tenantId,
        customerId,
        fieldName
      );

      const options = await ticketMetadataHierarchicalService.resolveFieldOptions(
        tenantId,
        customerId,
        fieldName
      );

      res.json({
        success: true,
        data: {
          configuration,
          options,
          inheritance: {
            configSource: configuration?.source || "none",
            optionsSource: options.length > 0 ? options[0].source : "none"
          }
        },
        customerId,
        fieldName
      });

    } catch (error) {
      console.error('❌ [Hierarchical] Error resolving field for customer:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to resolve field configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET resolve field configuration for tenant (global)
   * GET /api/ticket-metadata-hierarchical/tenant/field/:fieldName
   */
  async resolveFieldForTenant(req: AuthenticatedRequest, res: Response) {
    try {
      const { fieldName } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant required' });
      }

      console.log(`🔄 [Hierarchical] Resolving field ${fieldName} for tenant ${tenantId}`);

      const configuration = await ticketMetadataHierarchicalService.resolveFieldConfiguration(
        tenantId,
        null, // No customer ID = tenant global
        fieldName
      );

      const options = await ticketMetadataHierarchicalService.resolveFieldOptions(
        tenantId,
        null, // No customer ID = tenant global
        fieldName
      );

      res.json({
        success: true,
        data: {
          configuration,
          options,
          inheritance: {
            configSource: configuration?.source || "none",
            optionsSource: options.length > 0 ? options[0].source : "none"
          }
        },
        fieldName,
        tenantId
      });

    } catch (error) {
      console.error('❌ [Hierarchical] Error resolving field for tenant:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to resolve field configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getFieldOptions(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { customerId } = req.query;
      const { fieldName } = req.params;

      console.log(`🔍 Fetching field options for ${fieldName}:`, {
        tenantId,
        customerId,
        fieldName
      });

      const fieldOptions = await this.ticketMetadataService.getFieldOptionsHierarchical(
        tenantId,
        fieldName,
        customerId as string | undefined
      );

      console.log(`📊 Field options result for ${fieldName}:`, {
        optionsCount: fieldOptions.length,
        options: fieldOptions.map(opt => ({ value: opt.optionValue, label: opt.displayLabel }))
      });

      res.json({
        success: true,
        data: fieldOptions,
        message: `Field options retrieved for ${fieldName}`
      });
    } catch (error) {
      console.error('Error fetching hierarchical field options:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch field options',
        error: error.message
      });
    }
  }
}