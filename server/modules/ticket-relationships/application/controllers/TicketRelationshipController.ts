/**
 * TicketRelationshipController - Clean Architecture Implementation
 * Following 1qa.md specifications strictly
 * @module TicketRelationshipController
 */

import { Request, Response } from 'express';
import { FindTicketRelationshipsUseCase } from '../use-cases/FindTicketRelationshipsUseCase';
import { DeleteTicketRelationshipUseCase } from '../use-cases/DeleteTicketRelationshipUseCase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
  };
}

export class TicketRelationshipController {
  constructor(
    private findTicketRelationshipsUseCase: FindTicketRelationshipsUseCase,
    private deleteTicketRelationshipUseCase: DeleteTicketRelationshipUseCase
  ) {
    console.log('✅ [TicketRelationshipController] Initialized with dependencies');
  }

  async getRelationships(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🔍 [TicketRelationshipController] getRelationships called with:', { 
      ticketId: req.params.ticketId,
      tenantId: req.user?.tenantId 
    });

    try {
      const ticketId = req.params.ticketId;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
        return;
      }

      if (!ticketId) {
        res.status(400).json({ 
          success: false, 
          message: 'Ticket ID required' 
        });
        return;
      }

      const relationships = await this.findTicketRelationshipsUseCase.findByTicketId(ticketId, tenantId);

      console.log('✅ [TicketRelationshipController] Relationships found, returning data:', relationships.length);
      
      res.json({ 
        success: true, 
        data: relationships 
      });

    } catch (error: any) {
      console.error('❌ [TicketRelationshipController] Error getting relationships:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch relationships',
        error: error.message 
      });
    }
  }

  async getRelationshipsCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('📊 [TicketRelationshipController] getRelationshipsCount called with:', { 
      ticketId: req.params.ticketId,
      tenantId: req.user?.tenantId 
    });

    try {
      const ticketId = req.params.ticketId;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ message: 'Tenant ID required' });
        return;
      }

      if (!ticketId) {
        res.status(400).json({ message: 'Ticket ID required' });
        return;
      }

      const count = await this.findTicketRelationshipsUseCase.countByTicketId(ticketId, tenantId);

      console.log('✅ [TicketRelationshipController] Relationship count retrieved:', count);
      
      res.json({ count });

    } catch (error: any) {
      console.error('❌ [TicketRelationshipController] Error getting relationships count:', error);
      res.status(500).json({ 
        message: 'Failed to fetch relationships count',
        error: error.message 
      });
    }
  }

  async deleteRelationship(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🗑️ [TicketRelationshipController] deleteRelationship called with:', { 
      relationshipId: req.params.relationshipId,
      tenantId: req.user?.tenantId 
    });

    try {
      const relationshipId = req.params.relationshipId;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({ 
          success: false, 
          message: 'Tenant ID required' 
        });
        return;
      }

      if (!relationshipId) {
        res.status(400).json({ 
          success: false, 
          message: 'Relationship ID required' 
        });
        return;
      }

      const deleted = await this.deleteTicketRelationshipUseCase.execute(relationshipId, tenantId);

      console.log('✅ [TicketRelationshipController] Relationship deleted successfully:', relationshipId);
      
      res.json({ 
        success: true, 
        message: 'Relationship deleted successfully'
      });

    } catch (error: any) {
      console.error('❌ [TicketRelationshipController] Error deleting relationship:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete relationship',
        error: error.message 
      });
    }
  }
}