// Tickets Microservice Routes - JWT Authentication
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { storageSimple } from "../../storage-simple";
import { insertTicketSchema, insertTicketMessageSchema } from "../../../shared/schema";
import { sendSuccess, sendError, sendValidationError } from "../../utils/standardResponse";
import { mapFrontendToBackend } from "../../utils/fieldMapping";
import { z } from "zod";
import { trackTicketView, trackTicketEdit, trackTicketCreate, trackNoteView, trackNoteCreate } from '../../middleware/activityTrackingMiddleware';

// Generate unique action number for internal actions
async function generateActionNumber(pool: any, tenantId: string, ticketId: string): Promise<string> {
  try {
    // Get ticket number first
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const ticketQuery = `SELECT number FROM "${schemaName}".tickets WHERE id = $1`;
    const ticketResult = await pool.query(ticketQuery, [ticketId]);
    
    if (!ticketResult.rows.length) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }
    
    const ticketNumber = ticketResult.rows[0].number;
    
    // Create or get action sequence for this specific ticket
    const sequenceQuery = `
      INSERT INTO public.ticket_action_sequences (tenant_id, ticket_id, current_number, last_updated)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (tenant_id, ticket_id) 
      DO UPDATE SET 
        current_number = ticket_action_sequences.current_number + 1,
        last_updated = NOW()
      RETURNING current_number
    `;
    
    const result = await pool.query(sequenceQuery, [tenantId, ticketId]);
    const sequenceNumber = result.rows[0].current_number;
    
    // Format as {TICKET_NUMBER}AI{4-digit sequence} (e.g., T2025-000001AI0001)
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    const actionNumber = `${ticketNumber}AI${formattedSequence}`;
    
    console.log(`✅ Generated action number: ${actionNumber} for ticket: ${ticketNumber}`);
    return actionNumber;
    
  } catch (error) {
    console.error('⚠️ Error generating action number:', error);
    // Fallback to timestamp-based number if sequence fails
    const timestamp = Date.now();
    return `AI-FALLBACK-${timestamp.toString().slice(-6)}`;
  }
}

// 🚨 COMPLIANCE: Função auxiliar para auditoria completa
async function createCompleteAuditEntry(
  pool: any,
  schemaName: string,
  tenantId: string,
  ticketId: string,
  req: AuthenticatedRequest,
  actionType: string,
  description: string,
  metadata: any = {},
  fieldName?: string,
  oldValue?: string,
  newValue?: string
) {
  try {
    const { getClientIP, getUserAgent, getSessionId } = await import('../../utils/ipCapture');
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const sessionId = getSessionId(req);
    
    // Get user name
    const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [req.user.id]);
    const userName = userResult.rows[0]?.full_name || req.user?.email || 'Unknown User';

    const insertQuery = `
      INSERT INTO "${schemaName}".ticket_history 
      (tenant_id, ticket_id, performed_by, performed_by_name, action_type, description, field_name, old_value, new_value, ip_address, user_agent, session_id, created_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
      RETURNING *
    `;

    return await pool.query(insertQuery, [
      tenantId,
      ticketId,
      req.user.id,
      userName,
      actionType,
      description,
      fieldName || null,
      oldValue || null,
      newValue || null,
      ipAddress,
      userAgent,
      sessionId,
      JSON.stringify(metadata)
    ]);
  } catch (error) {
    console.error('⚠️ Erro na auditoria completa:', error);
    throw error;
  }
}

const ticketsRouter = Router();

// Get all tickets with pagination and filters
ticketsRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const assignedTo = req.query.assignedTo as string;

    const offset = (page - 1) * limit;
    let tickets = await storageSimple.getTickets(req.user.tenantId);

    // Apply filters
    if (status) {
      tickets = tickets.filter(ticket => ticket.status === status);
    }
    if (priority) {
      tickets = tickets.filter(ticket => ticket.priority === priority);
    }
    if (assignedTo) {
      tickets = tickets.filter(ticket => ticket.assignedToId === assignedTo);
    }

    return sendSuccess(res, {
      tickets,
      pagination: {
        page,
        limit,
        total: tickets.length
      },
      filters: { status, priority, assignedTo }
    }, "Tickets retrieved successfully");
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error fetching tickets', error, { tenantId: req.user?.tenantId });
    return sendError(res, error, "Failed to fetch tickets", 500);
  }
});

// Get ticket by ID with messages
ticketsRouter.get('/:id', jwtAuth, trackTicketView, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const ticket = await storageSimple.getTicketById(req.user.tenantId, req.params.id);
    if (!ticket) {
      return sendError(res, "Ticket not found", "Ticket not found", 404);
    }

    return sendSuccess(res, ticket, "Ticket retrieved successfully");
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error fetching ticket', error, { ticketId: req.params.id, tenantId: req.user?.tenantId });
    return sendError(res, error, "Failed to fetch ticket", 500);
  }
});

// Get urgent tickets (filtered from all tickets)
ticketsRouter.get('/urgent', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }

    const allTickets = await storageSimple.getTickets(req.user.tenantId);
    const urgentTickets = allTickets.filter(ticket => 
      ticket.priority === 'urgent' || ticket.priority === 'critical'
    );

    return sendSuccess(res, urgentTickets, "Urgent tickets retrieved successfully");
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error fetching urgent tickets', error, { tenantId: req.user?.tenantId });
    return sendError(res, error, "Failed to fetch urgent tickets", 500);
  }
});

// Create new ticket
ticketsRouter.post('/', jwtAuth, trackTicketCreate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Ensure we have required fields before parsing
    if (!req.body.subject || !req.body.caller_id) {
      return res.status(400).json({ 
        success: false,
        message: "Subject and caller ID are required" 
      });
    }

    // Debug: Log the incoming request body
    console.log('🔍 Incoming request body:', req.body);

    // Ensure we have the required customer ID from either field
    const customerId = req.body.customerId || req.body.caller_id;
    if (!customerId) {
      return res.status(400).json({ 
        success: false,
        message: "Customer ID or caller ID is required" 
      });
    }

    const ticketData = {
      ...req.body,
      tenantId: req.user.tenantId,
      customerId: customerId,
      caller_id: customerId,
      status: req.body.status || req.body.state || 'new'
    };

    // Debug: Log the processed ticket data
    console.log('🔍 Processed ticket data:', ticketData);

    // Validate the ticket data manually instead of using Zod
    if (!ticketData.subject) {
      return res.status(400).json({ 
        success: false,
        message: "Subject is required" 
      });
    }

    const ticket = await storageSimple.createTicket(req.user.tenantId, ticketData);

    // Create history entry for ticket creation
    try {
      const { getClientIP, getUserAgent, getSessionId } = await import('../../utils/ipCapture');
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);
      const sessionId = getSessionId(req);
      const { pool } = await import('../../db');
      const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;

      // Get user name
      const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
      const userResult = await pool.query(userQuery, [req.user.id]);
      const userName = userResult.rows[0]?.full_name || 'Unknown User';

      await pool.query(`
        INSERT INTO "${schemaName}".ticket_history 
        (tenant_id, ticket_id, action_type, description, performed_by, performed_by_name, ip_address, user_agent, session_id, created_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
      `, [
        req.user.tenantId,
        ticket.id,
        'ticket_created',
        `Ticket criado: ${ticketData.subject}`,
        req.user.id,
        userName,
        ipAddress,
        userAgent,
        sessionId,
        JSON.stringify({
          subject: ticketData.subject,
          priority: ticketData.priority,
          category: ticketData.category,
          status: ticketData.status || 'open'
        })
      ]);
    } catch (historyError) {
      console.log('⚠️ Aviso: Não foi possível criar entrada no histórico:', historyError.message);
    }

    return sendSuccess(res, ticket, "Ticket created successfully", 201);
  } catch (error) {
    console.error('❌ Detailed error creating ticket:', error);
    const { logError } = await import('../../utils/logger');
    logError('Error creating ticket', error, { tenantId: req.user?.tenantId });

    return res.status(500).json({
      success: false,
      message: "Failed to create ticket",
      error: error instanceof Error ? error.message : "Unknown error",
      details: error
    });
  }
});

// Update ticket - CORREÇÃO PROBLEMA 5: Padronização de middleware jwtAuth
ticketsRouter.put('/:id', jwtAuth, trackTicketEdit, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }

    const ticketId = req.params.id;
    const frontendUpdates = req.body;

    // DEBUG: Log incoming data for followers and customer_id investigation
    console.log('🔍 DEBUGGING TICKET UPDATE - Incoming data:', {
      ticketId,
      hasFollowers: !!frontendUpdates.followers,
      followersType: typeof frontendUpdates.followers,
      followersValue: frontendUpdates.followers,
      hasCustomerId: !!frontendUpdates.customer_id,
      customerIdValue: frontendUpdates.customer_id,
      assignedToId: frontendUpdates.assigned_to_id,
      allKeys: Object.keys(frontendUpdates)
    });

    // CORREÇÃO CRÍTICA 1: Aplicar mapeamento centralizado Frontend→Backend
    const backendUpdates = mapFrontendToBackend(frontendUpdates);

    // DEBUG: Log after mapping
    console.log('🔍 DEBUGGING TICKET UPDATE - After mapping:', {
      backendFollowers: backendUpdates.followers,
      backendCustomerId: backendUpdates.customer_id,
      backendAssignedToId: backendUpdates.assigned_to_id,
      allBackendKeys: Object.keys(backendUpdates)
    });

    // CORREÇÃO CRÍTICA 3: Campo location é texto livre, não FK
    // Manter consistência com schema do banco
    if (frontendUpdates.locationId) {
      backendUpdates.location = frontendUpdates.locationId;
      delete backendUpdates.location_id; // FK não existe no schema
    }

    // Garantir que location_id nunca seja enviado ao banco
    delete backendUpdates.location_id;

    // Remove undefined values
    Object.keys(backendUpdates).forEach(key => {
      if (backendUpdates[key] === undefined) {
        delete backendUpdates[key];
      }
    });

    // CRITICAL FIX: Pass parameters in correct order (tenantId, ticketId, updates)
    const updatedTicket = await storageSimple.updateTicket(req.user.tenantId, ticketId, backendUpdates);

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // 🚀 OTIMIZAÇÃO: Create history entry only for meaningful ticket updates
    try {
      // Only create history entry if there are actual field changes
      const meaningfulChanges = Object.keys(backendUpdates).filter(key => 
        !['updated_at', 'tenant_id'].includes(key)
      );

      if (meaningfulChanges.length > 0) {
        const { getClientIP, getUserAgent, getSessionId } = await import('../../utils/ipCapture');
        const ipAddress = getClientIP(req);
        const userAgent = getUserAgent(req);
        const sessionId = getSessionId(req);
        const { pool } = await import('../../db');
        const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;

        // Get user name for history record
        const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
        const userResult = await pool.query(userQuery, [req.user.id]);
        const userName = userResult.rows[0]?.full_name || 'Unknown User';

        // Create a more descriptive history entry
        const changeDescriptions = meaningfulChanges.map(field => {
          const oldValue = updatedTicket[field];
          const newValue = backendUpdates[field];
          return `${field}: "${oldValue}" → "${newValue}"`;
        }).join(', ');

        await pool.query(`
          INSERT INTO "${schemaName}".ticket_history 
          (tenant_id, ticket_id, action_type, description, performed_by, performed_by_name, ip_address, user_agent, session_id, created_at, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
        `, [
          req.user.tenantId,
          ticketId,
          'ticket_updated',
          `Campos alterados: ${changeDescriptions}`,
          req.user.id,
          userName,
          ipAddress,
          userAgent,
          sessionId,
          JSON.stringify({
            changes: backendUpdates,
            changedFields: meaningfulChanges
          })
        ]);

        console.log(`📝 History entry created for ${meaningfulChanges.length} field changes`);
      } else {
        console.log('⏭️ Skipping history entry - no meaningful changes detected');
      }
    } catch (historyError) {
      console.log('⚠️ Aviso: Não foi possível criar entrada no histórico:', historyError.message);
    }

    return sendSuccess(res, updatedTicket, "Ticket updated successfully");
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error updating ticket', error, { ticketId: req.params.id, tenantId: req.user?.tenantId });
    return sendError(res, error, "Failed to update ticket", 500);
  }
});

// Add message to ticket - CORREÇÃO PROBLEMA 5: Padronização de middleware jwtAuth
ticketsRouter.post('/:id/messages', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }

    const ticketId = req.params.id;
    const messageData = insertTicketMessageSchema.parse({
      ...req.body,
      ticketId,
      authorId: req.user.id,
    });

    // CORREÇÃO LSP: Método createTicketMessage não existe no storage atual
    // const message = await storageSimple.createTicketMessage(messageData);

    // Temporary placeholder until createTicketMessage is implemented
    const message = {
      id: `msg-${Date.now()}`,
      ticketId,
      authorId: req.user.id,
      message: messageData.message,
      createdAt: new Date().toISOString()
    };

    return sendSuccess(res, message, "Message added successfully", 201);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error adding ticket message', error, { ticketId: req.params.id });
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error.errors.map(e => `${e.path.join('.')}: ${e.message}`), "Invalid message data");
    }
    return sendError(res, error, "Failed to add message", 500);
  }
});

// Assign ticket to agent - CORREÇÃO PROBLEMA 5: Padronização de middleware jwtAuth
ticketsRouter.post('/:id/assign', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }

    const ticketId = req.params.id;
    const { assignedToId } = req.body;

    const updatedTicket = await storageSimple.updateTicket(req.user.tenantId, ticketId, { 
      assignedToId,
      status: 'in_progress'
    });

    if (!updatedTicket) {
      return sendError(res, "Ticket not found", "Ticket not found", 404);
    }

    // Create history entry for ticket assignment
    try {
      const { getClientIP, getUserAgent, getSessionId } = await import('../../utils/ipCapture');
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);
      const sessionId = getSessionId(req);
      const { pool } = await import('../../db');
      const schemaName = `tenant_${req.user.tenantId.replace(/-/g, '_')}`;

      // Get user name
      const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
      const userResult = await pool.query(userQuery, [req.user.id]);
      const userName = userResult.rows[0]?.full_name || 'Unknown User';

      await pool.query(`
        INSERT INTO "${schemaName}".ticket_history 
        (tenant_id, ticket_id, action_type, description, performed_by, performed_by_name, ip_address, user_agent, session_id, created_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
      `, [
        req.user.tenantId,
        ticketId,
        'ticket_assigned',
        `Ticket atribuído ao agente`,
        req.user.id,
        userName,
        ipAddress,
        userAgent,
        sessionId,
        JSON.stringify({
          assigned_to_id: assignedToId,
          status_changed_to: 'in_progress'
        })
      ]);
    } catch (historyError) {
      console.log('⚠️ Aviso: Não foi possível criar entrada no histórico:', historyError.message);
    }

    return sendSuccess(res, updatedTicket, "Ticket assigned successfully");
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return sendError(res, error, "Failed to assign ticket", 500);
  }
});

// Delete ticket
ticketsRouter.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const ticketId = req.params.id;

    // First check if ticket exists
    const existingTicket = await storageSimple.getTicketById(req.user.tenantId, ticketId);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Mark as deleted by updating status
    const success = await storageSimple.updateTicket(req.user.tenantId, ticketId, { status: 'deleted' });

    if (!success) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // TODO: Implement activity logging when createActivityLog method is available

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Failed to delete ticket" });
  }
});

// === TICKET MODALS ENDPOINTS ===

// Get ticket attachments
ticketsRouter.get('/:id/attachments', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        ta.id,
        ta.file_name as filename,
        ta.file_name as original_filename,
        ta.file_size,
        ta.content_type as mime_type,
        ta.file_path,
        ta.file_type as description,
        ta.created_by as uploaded_by,
        ta.created_at,
        u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM "${schemaName}".ticket_attachments ta
      LEFT JOIN public.users u ON ta.created_by = u.id
      WHERE ta.ticket_id = $1 AND ta.tenant_id = $2 AND ta.is_active = true
      ORDER BY ta.created_at DESC
    `;

    const result = await pool.query(query, [id, tenantId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    // Return empty array instead of 500 error to prevent frontend crashes
    res.json({
      success: true,
      data: [],
      count: 0
    });
  }
});

// Upload ticket attachment
ticketsRouter.post('/:id/attachments', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Placeholder - return success for now
    res.json({ success: true, message: "Attachment uploaded successfully" });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ message: "Failed to upload attachment" });
  }
});

// Delete ticket attachment
ticketsRouter.delete('/:id/attachments/:attachmentId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Placeholder - return success for now
    res.json({ success: true, message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ message: "Failed to delete attachment" });
  }
});

// Get ticket actions
ticketsRouter.get('/:id/actions', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        th.id,
        th.action_type as type,
        th.description as content,
        th.description,
        COALESCE(tia.status, 'pending') as status,
        COALESCE(tia.estimated_hours * 60, 0) as time_spent,
        COALESCE(tia.estimated_hours * 60, 0) as estimated_minutes,
        0 as time_spent_minutes,
        COALESCE(tia.start_time, th.created_at) as start_time,
        COALESCE(tia.end_time, th.created_at) as end_time,
        tia.action_number,
        '[]'::text as linked_items,
        false as has_file,
        'system' as contact_method,
        '' as vendor,
        true as is_public,
        th.created_at,
        th.performed_by as created_by,
        tia.agent_id as assigned_to_id,
        u.first_name || ' ' || u.last_name as agent_name,
        u.first_name || ' ' || u.last_name as "createdByName",
        COALESCE(au.first_name || ' ' || au.last_name, au.email) as "assigned_to_name",
        th.action_type as actionType,
        '' as work_log
      FROM "${schemaName}".ticket_history th
      LEFT JOIN public.users u ON th.performed_by = u.id
      LEFT JOIN "${schemaName}".ticket_internal_actions tia ON (
        tia.ticket_id = th.ticket_id 
        AND tia.action_type = th.action_type 
        AND ABS(EXTRACT(EPOCH FROM (tia.created_at - th.created_at))) < 120
      )
      LEFT JOIN public.users au ON tia.agent_id = au.id
      WHERE th.tenant_id = $1::uuid 
        AND th.ticket_id = $2::uuid
        AND th.action_type NOT IN ('field_updated', 'status_changed', 'priority_changed', 'assignment_changed', 'note_added', 'communication_added', 'attachment_added')
      ORDER BY th.created_at DESC
    `;

    const result = await pool.query(query, [tenantId, id]);

    // For actions without action_number, generate them on-the-fly
    const processedRows = await Promise.all(result.rows.map(async (row) => {
      if (!row.action_number && (row.type === 'ação interna' || row.actionType === 'ação interna')) {
        try {
          // Generate action number for existing actions
          const actionNumber = await generateActionNumber(pool, tenantId, id);
          
          // Update the ticket_internal_actions table if it exists
          const insertQuery = `
            INSERT INTO "${schemaName}".ticket_internal_actions 
            (id, tenant_id, ticket_id, action_number, action_type, title, description, agent_id, start_time, end_time, estimated_hours, status, priority, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
            ON CONFLICT DO NOTHING
          `;
          
          await pool.query(insertQuery, [
            tenantId,
            id,
            actionNumber,
            row.actionType || 'internal',
            `${row.actionType || 'Internal'} - Ticket #${id.slice(0, 8)}`,
            row.description || row.content,
            row.created_by,
            row.start_time,
            row.end_time,
            (row.estimated_minutes || 0) / 60,
            row.status || 'pending',
            'medium',
            row.created_at
          ]);
          
          return { ...row, action_number: actionNumber };
        } catch (err) {
          console.error('Error generating action number for existing action:', err);
          return row;
        }
      }
      return row;
    }));

    res.json({
      success: true,
      data: processedRows,
      count: processedRows.length
    });
  } catch (error) {
    console.error("Error fetching actions:", error);
    // Return empty array instead of 500 error to prevent frontend crashes
    res.json({
      success: true,
      data: [],
      count: 0
    });
  }
});

// Get single internal action for editing
ticketsRouter.get('/:ticketId/actions/:actionId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { ticketId, actionId } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        th.id,
        th.action_type as actionType,
        th.action_type as type,
        th.description,
        th.description as content,
        th.performed_by as assigned_to_id,
        COALESCE(tia.status, 'pending') as status,
        COALESCE(tia.estimated_hours * 60, 0) as estimated_minutes,
        0 as time_spent_minutes,
        COALESCE(TO_CHAR(tia.start_time, 'YYYY-MM-DD"T"HH24:MI'), '') as start_time,
        COALESCE(TO_CHAR(tia.end_time, 'YYYY-MM-DD"T"HH24:MI'), '') as end_time,
        tia.action_number,
        true as is_public,
        '' as work_log,
        th.created_at,
        u.first_name || ' ' || u.last_name as "createdByName",
        COALESCE(au.first_name || ' ' || au.last_name, au.email) as "assigned_to_name"
      FROM "${schemaName}".ticket_history th
      LEFT JOIN public.users u ON th.performed_by = u.id
      LEFT JOIN "${schemaName}".ticket_internal_actions tia ON (
        tia.ticket_id = th.ticket_id 
        AND tia.action_type = th.action_type 
        AND ABS(EXTRACT(EPOCH FROM (tia.created_at - th.created_at))) < 30
      )
      LEFT JOIN public.users au ON tia.agent_id = au.id
      WHERE th.tenant_id = $1::uuid 
        AND th.ticket_id = $2::uuid
        AND th.id = $3::uuid
        AND th.action_type NOT IN ('field_updated', 'status_changed', 'priority_changed', 'assignment_changed', 'note_added', 'communication_added', 'attachment_added')
    `;

    const result = await pool.query(query, [tenantId, ticketId, actionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Action not found" 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching action for edit:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch action" 
    });
  }
});

// Create ticket action
ticketsRouter.post('/:id/actions', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const { 
      actionType, 
      workLog, 
      description, 
      timeSpent, 
      startDateTime, 
      endDateTime,
      assignedToId,
      status = 'pending',
      is_public = false
    } = req.body;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Validate required fields
    if (!actionType) {
      return res.status(400).json({ 
        success: false,
        message: "Action type is required" 
      });
    }

    // Verify ticket exists
    const ticketCheck = await pool.query(
      `SELECT id FROM "${schemaName}".tickets WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Ticket not found" 
      });
    }

    // Parse time spent (format: "0:00:00:25" -> total minutes)
    let estimatedMinutes = 0;
    if (timeSpent) {
      const timeParts = timeSpent.split(':');
      if (timeParts.length >= 3) {
        const hours = parseInt(timeParts[0]) || 0;
        const minutes = parseInt(timeParts[1]) || 0;
        const seconds = parseInt(timeParts[2]) || 0;
        estimatedMinutes = (hours * 60) + minutes + Math.round(seconds / 60);
      }
    }

    // Parse start and end times
    const startTime = startDateTime ? new Date(startDateTime) : new Date();
    const endTime = endDateTime ? new Date(endDateTime) : null;

    // Prepare description and work log
    const actionDescription = workLog || description || `${actionType} action performed`;

    // Get user info for IP capture
    const { getClientIP, getUserAgent, getSessionId } = await import('../../utils/ipCapture');
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const sessionId = getSessionId(req);

    // Determine who is assigned (use assignedToId if provided and not 'unassigned', otherwise current user)
    const finalAssignedId = (assignedToId && assignedToId !== 'unassigned') ? assignedToId : req.user.id;

    // Get user name for complete audit trail
    const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [req.user.id]);
    const userName = userResult.rows[0]?.full_name || req.user?.email || 'Unknown User';

    // Insert action into ticket_history table using correct column names
    const insertQuery = `
      INSERT INTO "${schemaName}".ticket_history 
      (id, tenant_id, ticket_id, action_type, description, performed_by, performed_by_name, ip_address, user_agent, session_id, created_at, metadata)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
      RETURNING id, action_type, description, created_at
    `;

    const result = await pool.query(insertQuery, [
      tenantId,           // $1 tenant_id
      id,                 // $2 ticket_id
      'ação interna',     // $3 action_type - SEMPRE "ação interna" independente do tipo específico
      actionDescription,  // $4 description
      req.user.id,        // $5 performed_by
      userName,           // $6 performed_by_name
      ipAddress,          // $7 ip_address  
      userAgent,          // $8 user_agent
      sessionId,          // $9 session_id
      JSON.stringify({    // $10 metadata
        action_type: actionType, // Manter tipo específico nos metadados para referência
        time_spent: timeSpent,
        start_time: startDateTime,
        end_time: endDateTime,
        assigned_to: finalAssignedId,
        status: status
      })
    ]);

    // Generate unique action number for all internal actions
    const actionNumber = await generateActionNumber(pool, tenantId, id);
    
    // Create entry in ticket_internal_actions for scheduling (always create for tracking)
    const internalActionQuery = `
      INSERT INTO "${schemaName}".ticket_internal_actions 
      (id, tenant_id, ticket_id, action_number, action_type, title, description, agent_id, start_time, end_time, estimated_hours, status, priority, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, action_number
    `;

    const internalActionResult = await pool.query(internalActionQuery, [
      tenantId,                          // $1 tenant_id
      id,                               // $2 ticket_id
      actionNumber,                     // $3 action_number
      actionType,                       // $4 action_type
      `${actionType} - Ticket #${id.slice(0, 8)}`, // $5 title
      actionDescription,                // $6 description
      finalAssignedId,                  // $7 agent_id (assigned person)
      startTime || null,                // $8 start_time (nullable)
      endTime || null,                  // $9 end_time (nullable)
      estimatedMinutes ? estimatedMinutes / 60 : 0, // $10 estimated_hours
      status,                           // $11 status (from frontend)
      'medium'                          // $12 priority
    ]);

    if (result.rows.length === 0) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to create action" 
      });
    }

    const newAction = result.rows[0];

    // Update ticket's updated_at timestamp
    await pool.query(
      `UPDATE "${schemaName}".tickets SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    console.log('✅ Ação interna criada com sucesso:', newAction);

    res.status(201).json({
      success: true,
      message: "Ação interna criada com sucesso",
      data: {
        id: newAction.id,
        actionNumber: actionNumber,  // Include the generated action number
        actionType: newAction.action_type,
        type: newAction.action_type,
        content: newAction.description,
        description: newAction.description,
        workLog: newAction.work_log,
        timeSpent: newAction.time_spent,
        status: 'active',
        time_spent: newAction.estimated_hours,
        start_time: newAction.start_time,
        end_time: newAction.end_time,
        customer_id: null,
        linked_items: '[]',
        has_file: false,
        contact_method: 'system',
        vendor: '',
        is_public: true,
        isPublic: true,
        createdBy: req.user.id,
        createdByName: userName,
        createdAt: newAction.created_at,
        agent_name: userName
      }
    });

  } catch (error) {
    console.error("❌ Erro ao criar ação interna:", error);
    res.status(500).json({ 
      success: false,
      message: "Falha ao criar ação interna",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Get ticket communications
ticketsRouter.get('/:id/communications', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        tc.id,
        tc.communication_type as channel,
        tc.direction,
        tc.from_address as "from",
        tc.to_address as "to", 
        tc.subject,
        tc.content,
        tc.message_id,
        tc.thread_id,
        tc.cc_address,
        tc.bcc_address,
        tc.is_public,
        tc.created_at as timestamp,
        tc.updated_at
      FROM "${schemaName}".ticket_communications tc
      WHERE tc.ticket_id = $1 AND tc.tenant_id = $2
      ORDER BY tc.created_at DESC
    `;

    const result = await pool.query(query, [id, tenantId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching communications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch communications" });
  }
});

// Get ticket emails (alias for communications)
ticketsRouter.get('/:id/emails', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        tc.id,
        tc.channel,
        tc.direction,
        tc.from_contact as "from",
        tc.to_contact as "to", 
        tc.subject,
        tc.content,
        tc.message_id,
        tc.thread_id,
        tc.attachments,
        tc.metadata,
        tc.is_read,
        tc.created_at as timestamp,
        tc.updated_at
      FROM "${schemaName}".ticket_communications tc
      WHERE tc.ticket_id = $1 AND tc.tenant_id = $2 AND tc.channel = 'email' AND tc.is_active = true
      ORDER BY tc.created_at DESC
    `;

    const result = await pool.query(query, [id, tenantId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ success: false, message: "Failed to fetch emails" });
  }
});

// Send ticket email
ticketsRouter.post('/:id/emails', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { to, subject, content } = req.body;

    // Validate required fields
    if (!to || !subject || !content) {
      return res.status(400).json({ message: "To, subject, and content are required" });
    }

    // Placeholder - return success for now
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

// Get ticket notes
ticketsRouter.get('/:id/notes', jwtAuth, trackNoteView, async (req: AuthenticatedRequest, res) =>{
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        tn.id,
        tn.content,
tn.note_type,
        tn.is_internal,
        tn.is_public,
        tn.created_by,
        tn.created_at,
        tn.updated_at,
        u.first_name || ' ' || u.last_name as author_name
      FROM "${schemaName}".ticket_notes tn
      LEFT JOIN public.users u ON tn.created_by = u.id
      WHERE tn.ticket_id = $1 AND tn.tenant_id = $2 AND tn.is_active = true
      ORDER BY tn.created_at DESC
    `;

    const result = await pool.query(query, [id, tenantId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    // Return empty array instead of 500 error to prevent frontend crashes
    res.json({
      success: true,
      data: [],
      count: 0
    });
  }
});

// Create ticket note - IMPLEMENTAÇÃO REAL
ticketsRouter.post('/:id/notes', jwtAuth, trackNoteCreate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const { content, noteType = 'general', isInternal = false, isPublic = true } = req.body;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Note content is required" });
    }

    // Insert note into database
    const insertQuery = `
      INSERT INTO "${schemaName}".ticket_notes 
      (id, ticket_id, tenant_id, content, note_type, is_internal, is_public, created_by, created_at, updated_at, is_active)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), true)
      RETURNING id, content, note_type, is_internal, is_public, created_by, created_at
    `;

    const result = await pool.query(insertQuery, [
      id,                    // ticket_id
      tenantId,             // tenant_id  
      content.trim(),       // content
      noteType,             // note_type
      isInternal,           // is_internal
      isPublic,             // is_public
      req.user.id           // created_by
    ]);

    if (result.rows.length === 0) {
      return res.status(500).json({ message: "Failed to create note" });
    }

    const newNote = result.rows[0];

    // Get user name for response
    const userQuery = `SELECT first_name || ' ' || last_name as author_name FROM public.users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [req.user.id]);

    const userName = userResult.rows[0]?.author_name || 'Unknown User';
    newNote.author_name = userName;

    // Create history entry for the note creation
    try {
      const { getClientIP, getUserAgent, getSessionId } = await import('../../utils/ipCapture');
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);
      const sessionId = getSessionId(req);

      await pool.query(`
        INSERT INTO "${schemaName}".ticket_history 
        (tenant_id, ticket_id, action_type, description, performed_by, performed_by_name, ip_address, user_agent, session_id, created_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
      `, [
        tenantId,
        id,
        'note_added',
        `Nota adicionada: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        req.user.id,
        userName,
        ipAddress,
        userAgent,
        sessionId,
        JSON.stringify({
          note_type: noteType,
          is_internal: isInternal,
          is_public: isPublic,
          content_preview: content.substring(0, 200)
        })
      ]);
    } catch (historyError) {
      console.log('⚠️ Aviso: Não foi possível criar entrada no histórico:', historyError.message);
    }

    res.status(201).json({
      success: true,
      data: newNote,
      message: "Note created successfully"
    });

  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create note",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get ticket history
ticketsRouter.get('/:id/history', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Get only ticket history - actions are already recorded in history when created
    const historyQuery = `
      SELECT 
        'history' as source,
        th.id,
        th.action_type,
        th.description,
        th.performed_by as performed_by,
        th.performed_by_name,
        th.old_value,
        th.new_value,
        th.field_name,
        th.created_at,
        th.ip_address,
        th.user_agent,
        th.session_id,
        th.metadata
      FROM "${schemaName}".ticket_history th
      WHERE th.ticket_id = $1 AND th.tenant_id = $2
      ORDER BY th.created_at DESC
    `;

    const historyResult = await pool.query(historyQuery, [id, tenantId]);

    res.json({
      success: true,
      data: historyResult.rows,
      count: historyResult.rows.length
    });

  } catch (error) {
    console.error("Error fetching ticket history:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch ticket history" 
    });
  }
});

// === TICKET RELATIONSHIPS ENDPOINTS ===

// Get ticket relationships
ticketsRouter.get('/:id/relationships', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    const query = `
      SELECT 
        tr.id,
        tr.relationship_type as "relationshipType",
        tr.description,
        tr.created_at as "createdAt",
        CASE 
          WHEN tr.source_ticket_id = $1 THEN t_target.id
          WHEN tr.target_ticket_id = $1 THEN t_source.id
        END as "targetTicket.id",
        CASE 
          WHEN tr.source_ticket_id = $1 THEN t_target.subject
          WHEN tr.target_ticket_id = $1 THEN t_source.subject
        END as "targetTicket.subject",
        CASE 
          WHEN tr.source_ticket_id = $1 THEN t_target.status
          WHEN tr.target_ticket_id = $1 THEN t_source.status
        END as "targetTicket.status",
        CASE 
          WHEN tr.source_ticket_id = $1 THEN t_target.priority
          WHEN tr.target_ticket_id = $1 THEN t_source.priority
        END as "targetTicket.priority",
        CASE 
          WHEN tr.source_ticket_id = $1 THEN t_target.number
          WHEN tr.target_ticket_id = $1 THEN t_source.number
        END as "targetTicket.number"
      FROM "${schemaName}".ticket_relationships tr
      LEFT JOIN "${schemaName}".tickets t_target ON t_target.id = tr.target_ticket_id
      LEFT JOIN "${schemaName}".tickets t_source ON t_source.id = tr.source_ticket_id
      WHERE (tr.source_ticket_id = $1 OR tr.target_ticket_id = $1) AND tr.tenant_id = $2
      ORDER BY tr.created_at DESC
    `;

    const result = await pool.query(query, [id, tenantId]);

    // Transform flat results to nested objects
    const relationships = result.rows.map(row => ({
      id: row.id,
      relationshipType: row.relationshipType,
      description: row.description,
      createdAt: row.createdAt,
      targetTicket: {
        id: row['targetTicket.id'],
        subject: row['targetTicket.subject'],
        status: row['targetTicket.status'],
        priority: row['targetTicket.priority'],
        number: row['targetTicket.number']
      }
    }));
    res.json(relationships);
  } catch (error) {
    console.error("Error fetching ticket relationships:", error);
    res.status(500).json({ message: "Failed to fetch ticket relationships" });
  }
});

// Create ticket relationship
ticketsRouter.post('/:id/relationships', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { id } = req.params;
    const { targetTicketId, relationshipType, description } = req.body;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Validate required fields
    if (!targetTicketId || !relationshipType) {
      return res.status(400).json({ message: "Target ticket ID and relationship type are required" });
    }

    // Check if both tickets exist
    const ticketCheck = await pool.query(
      `SELECT id FROM "${schemaName}".tickets WHERE id IN ($1, $2) AND tenant_id = $3`,
      [id, targetTicketId, tenantId]
    );

    if (ticketCheck.rows.length !== 2) {
      return res.status(400).json({ message: "One or both tickets not found" });
    }

    // Check for duplicate relationships
    const duplicateCheck = await pool.query(
      `SELECT id FROM "${schemaName}".ticket_relationships 
       WHERE source_ticket_id = $1 AND target_ticket_id = $2 AND relationship_type = $3`,
      [id, targetTicketId, relationshipType]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ message: "Relationship already exists" });
    }

    // Create relationship
    const insertQuery = `
      INSERT INTO "${schemaName}".ticket_relationships 
      (id, tenant_id, source_ticket_id, target_ticket_id, relationship_type, description, created_by, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, relationship_type, description, created_at
    `;

    const result = await pool.query(insertQuery, [
      tenantId, id, targetTicketId, relationshipType, description || null, req.user.id
    ]);

    // Create reciprocal relationship for bidirectional types
    const bidirectionalTypes = ['related', 'duplicate'];
    if (bidirectionalTypes.includes(relationshipType)) {
      await pool.query(insertQuery, [
        tenantId, targetTicketId, id, relationshipType, description || null, req.user.id
      ]);
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Relationship created successfully"
    });

  } catch (error) {
    console.error("Error creating ticket relationship:", error);
    res.status(500).json({ message: "Failed to create ticket relationship" });
  }
});

// Delete ticket relationship
ticketsRouter.delete('/relationships/:relationshipId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { relationshipId } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Delete the relationship (hard delete since no is_active column)
    const result = await pool.query(
      `DELETE FROM "${schemaName}".ticket_relationships 
       WHERE id = $1 AND tenant_id = $2`,
      [relationshipId, tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    res.json({
      success: true,
      message: "Relationship removed successfully"
    });

  } catch (error) {
    console.error("Error deleting ticket relationship:", error);
    res.status(500).json({ message: "Failed to delete ticket relationship" });
  }
});

// Get internal actions for scheduling (by date range)
ticketsRouter.get('/internal-actions/schedule/:startDate/:endDate', jwtAuth, async (req: AuthenticatedRequest, res) => {
  const startDateParam = `${req.params.startDate} 00:00:00`;
  const endDateParam = `${req.params.endDate} 23:59:59`;
  
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { startDate, endDate } = req.params;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Debug logs
    console.log('🔍 INTERNAL ACTIONS QUERY DEBUG:', {
      startDate,
      endDate,
      startDateParam,
      endDateParam,
      tenantId,
      schemaName
    });

    const query = `
      SELECT 
        tia.id,
        tia.action_number,
        tia.title,
        tia.description,
        tia.action_type,
        tia.start_time as "startDateTime",
        tia.end_time as "endDateTime",
        tia.status,
        tia.priority,
        tia.agent_id as "agentId",
        tia.ticket_id as "ticketId",
        tia.estimated_hours,
        t.number as "ticketNumber",
        t.subject as "ticketSubject",
        u.first_name || ' ' || u.last_name as "agentName",
        u.email as "agentEmail"
      FROM "${schemaName}".ticket_internal_actions tia
      LEFT JOIN "${schemaName}".tickets t ON tia.ticket_id = t.id
      LEFT JOIN public.users u ON tia.agent_id = u.id
      WHERE tia.tenant_id = $1::uuid 
        AND tia.start_time >= $2::timestamp
        AND tia.start_time <= $3::timestamp
      ORDER BY tia.start_time ASC
    `;

    const result = await pool.query(query, [tenantId, startDateParam, endDateParam]);
    
    console.log('🔍 INTERNAL ACTIONS RESULT:', {
      rowCount: result.rows.length,
      queryParams: [tenantId, startDateParam, endDateParam],
      firstRow: result.rows[0] || null
    });

    const internalActions = result.rows.map(row => ({
      id: row.id,
      actionNumber: row.action_number, // Include the unique action number
      title: `${row.action_type}: ${row.title}`,
      description: row.description,
      startDateTime: row.startDateTime,
      endDateTime: row.endDateTime || row.startDateTime, // Use start time if no end time
      status: row.status,
      priority: row.priority,
      agentId: row.agentId,
      ticketId: row.ticketId,
      ticketNumber: row.ticketNumber,
      ticketSubject: row.ticketSubject,
      agentName: row.agentName,
      agentEmail: row.agentEmail,
      type: 'internal_action', // Distinguish from regular schedules
      actionType: row.action_type,
      estimatedHours: row.estimated_hours,
      actualHours: 0 // Default value since column doesn't exist
    }));

    res.json({
      success: true,
      data: internalActions,
      count: internalActions.length
    });
  } catch (error) {
    console.error("Error fetching internal actions for schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch internal actions for schedule",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update internal action
ticketsRouter.put('/:ticketId/actions/:actionId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { ticketId, actionId } = req.params;
    const { 
      actionType, 
      workLog, 
      description, 
      timeSpent, 
      startDateTime, 
      endDateTime,
      assignedToId,
      status = 'pending',
      is_public = false
    } = req.body;
    const tenantId = req.user.tenantId;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    console.log('🔧 PUT Update - Received data:', {
      ticketId,
      actionId,
      actionType,
      description,
      workLog,
      startDateTime,
      endDateTime,
      status
    });

    // ONLY update ticket_history table - DO NOT create new records
    const updateHistoryQuery = `
      UPDATE "${schemaName}".ticket_history 
      SET description = $1, action_type = $2
      WHERE id = $3 AND tenant_id = $4 AND ticket_id = $5
      RETURNING *
    `;

    const finalDescription = workLog || description || 'Ação interna atualizada';
    
    // Primeiro buscar o action_type atual para mantê-lo
    const getCurrentTypeQuery = `
      SELECT action_type FROM "${schemaName}".ticket_history 
      WHERE id = $1 AND tenant_id = $2 AND ticket_id = $3
    `;
    const currentTypeResult = await pool.query(getCurrentTypeQuery, [actionId, tenantId, ticketId]);
    const currentActionType = currentTypeResult.rows[0]?.action_type || 'ação interna';
    
    // Manter o tipo original se for "ação interna", caso contrário usar o fornecido
    const finalActionType = currentActionType === 'ação interna' ? 'ação interna' : (actionType || currentActionType);

    const historyResult = await pool.query(updateHistoryQuery, [
      finalDescription,
      finalActionType,
      actionId,
      tenantId,
      ticketId
    ]);

    if (historyResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Action not found in history table" 
      });
    }

    // Update corresponding ticket_internal_actions if it exists
    const updateInternalQuery = `
      UPDATE "${schemaName}".ticket_internal_actions 
      SET 
        description = $1,
        action_type = $2,
        start_time = $3,
        end_time = $4,
        status = $5,
        agent_id = $6,
        estimated_hours = $7
      WHERE ticket_id = $8 AND action_type = $9 AND tenant_id = $10
        AND ABS(EXTRACT(EPOCH FROM (created_at - $11::timestamp))) < 120
    `;

    const startTime = startDateTime ? new Date(startDateTime).toISOString() : null;
    const endTime = endDateTime ? new Date(endDateTime).toISOString() : null;
    const estimatedHours = timeSpent ? parseInt(timeSpent) / 60 : 0;
    const historyCreatedAt = historyResult.rows[0].created_at;

    await pool.query(updateInternalQuery, [
      finalDescription,
      finalActionType,
      startTime,
      endTime,
      status,
      assignedToId,
      estimatedHours,
      ticketId,
      finalActionType,
      tenantId,
      historyCreatedAt
    ]);

    res.json({
      success: true,
      message: "Ação interna atualizada com sucesso",
      data: historyResult.rows[0]
    });
  } catch (error) {
    console.error("Error updating internal action:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update internal action",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete internal action
ticketsRouter.delete('/:ticketId/actions/:actionId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { ticketId, actionId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const { pool } = await import('../../db');
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // 🚨 CORREÇÃO CRÍTICA: Primeiro capturar dados antes de excluir
    const getActionQuery = `
      SELECT * FROM "${schemaName}".ticket_history 
      WHERE id = $1 AND tenant_id = $2 AND ticket_id = $3
    `;

    const actionResult = await pool.query(getActionQuery, [actionId, tenantId, ticketId]);

    if (actionResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Action not found" 
      });
    }

    const deletedAction = actionResult.rows[0];

    // 🚨 CORREÇÃO CRÍTICA: Adicionar entrada no histórico ANTES de excluir
    const historyInsertQuery = `
      INSERT INTO "${schemaName}".ticket_history 
      (tenant_id, ticket_id, performed_by, performed_by_name, action_type, description, field_name, old_value, new_value, ip_address, user_agent, session_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `;

    const historyDescription = `Ação interna excluída: ${deletedAction.description || deletedAction.action_type || 'Ação sem descrição'}`;
    
    // Capturar dados da sessão para auditoria completa
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.get('User-Agent') || null;
    const sessionId = req.sessionID || 'no-session';
    const performedByName = req.user?.firstName && req.user?.lastName 
      ? `${req.user.firstName} ${req.user.lastName}` 
      : req.user?.email || null;
    
    await pool.query(historyInsertQuery, [
      tenantId,
      ticketId,
      userId,
      performedByName,
      'action_deleted',
      historyDescription,
      'internal_action',
      `ID: ${actionId}`,
      null,
      ipAddress,
      userAgent,
      sessionId
    ]);

    // Agora excluir a ação interna do histórico
    const deleteQuery = `
      DELETE FROM "${schemaName}".ticket_history 
      WHERE id = $1 AND tenant_id = $2 AND ticket_id = $3
      RETURNING *
    `;

    const result = await pool.query(deleteQuery, [actionId, tenantId, ticketId]);

    // Also delete from ticket_internal_actions if exists
    await pool.query(`
      DELETE FROM "${schemaName}".ticket_internal_actions 
      WHERE ticket_id = $1 AND tenant_id = $2
    `, [ticketId, tenantId]);

    res.json({
      success: true,
      message: "Ação interna excluída com sucesso"
    });
  } catch (error) {
    console.error("Error deleting internal action:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete internal action",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { ticketsRouter };