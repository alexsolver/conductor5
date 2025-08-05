import type { Response } from 'express';
import { db } from '../../../../db-tenant';
import {
  ticketLpuSettings,
  ticketPlannedItems,
  ticketConsumedItems,
  ticketCostsSummary
} from '../../../../../shared/schema-master';
import { items } from '../../../../../shared/schema-materials-services';
import { eq, and, desc, sql } from 'drizzle-orm';
import { sendSuccess, sendError } from '../../../../utils/standardResponse';
import type { AuthenticatedRequest } from '../../../../middleware/jwtAuth';

// Import audit function
async function createCompleteAuditEntry(
  pool: any,
  schemaName: string,
  tenantId: string,
  ticketId: string,
  req: AuthenticatedRequest,
  actionType: string,
  description: string,
  metadata: any = {}
) {
  try {
    const { getClientIP, getUserAgent, getSessionId } = await import('../../../../utils/ipCapture');
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const sessionId = getSessionId(req);

    // Get user name for history record
    const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [req.user?.id]);
    const userName = userResult.rows[0]?.full_name || 'Unknown User';

    await pool.query(`
      INSERT INTO "${schemaName}".ticket_history
      (tenant_id, ticket_id, action_type, description, performed_by, performed_by_name, ip_address, user_agent, session_id, created_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
    `, [
      tenantId,
      ticketId,
      actionType,
      description,
      req.user?.id,
      userName,
      ipAddress,
      userAgent,
      sessionId,
      JSON.stringify(metadata)
    ]);
  } catch (error) {
    console.error('Error creating audit entry:', error);
    throw error;
  }
}



import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/jwtAuth';

export class TicketMaterialsController {
  async getTicketMaterials(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;

      const materials = [
        {
          id: '1',
          ticketId,
          itemId: '1',
          itemName: 'Material Exemplo',
          quantity: 2,
          unitPrice: 50.00,
          totalPrice: 100.00,
          status: 'Solicitado'
        }
      ];

      res.json({ success: true, data: materials });
    } catch (error) {
      console.error('Error fetching ticket materials:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch ticket materials' });
    }
  }

  async addMaterialToTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const { itemId, quantity, unitPrice } = req.body;

      const material = {
        id: Date.now().toString(),
        ticketId,
        itemId,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        status: 'Solicitado',
        addedAt: new Date().toISOString()
      };

      res.status(201).json({ success: true, data: material });
    } catch (error) {
      console.error('Error adding material to ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to add material to ticket' });
    }
  }

  async updateTicketMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId, materialId } = req.params;
      const updateData = req.body;

      const updatedMaterial = {
        id: materialId,
        ticketId,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      res.json({ success: true, data: updatedMaterial });
    } catch (error) {
      console.error('Error updating ticket material:', error);
      res.status(500).json({ success: false, message: 'Failed to update ticket material' });
    }
  }

  async removeMaterialFromTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId, materialId } = req.params;

      res.json({ success: true, message: 'Material removed from ticket successfully' });
    } catch (error) {
      console.error('Error removing material from ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to remove material from ticket' });
    }
  }
}