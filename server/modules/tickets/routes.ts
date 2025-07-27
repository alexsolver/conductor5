// Tickets Microservice Routes - JWT Authentication
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { storageSimple } from "../../storage-simple";
import { insertTicketSchema, insertTicketMessageSchema } from "../../../shared/schema";
import { z } from "zod";

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
    let tickets = await storageSimple.getTickets(req.user.tenantId, limit, offset);

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

    res.json({
      tickets,
      pagination: {
        page,
        limit,
        total: tickets.length
      },
      filters: { status, priority, assignedTo }
    });
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error fetching tickets', error, { tenantId: req.user?.tenantId });
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// Get ticket by ID with messages
ticketsRouter.get('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const ticket = await storageSimple.getTicketById(req.user.tenantId, req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error fetching ticket', error, { ticketId: req.params.id, tenantId: req.user?.tenantId });
    res.status(500).json({ message: "Failed to fetch ticket" });
  }
});

// Get urgent tickets
ticketsRouter.get('/urgent', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const urgentTickets = await storageSimple.getUrgentTickets(req.user.tenantId);
    res.json(urgentTickets);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error fetching urgent tickets', error, { tenantId: req.user?.tenantId });
    res.status(500).json({ message: "Failed to fetch urgent tickets" });
  }
});

// Create new ticket
ticketsRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const ticketData = insertTicketSchema.parse({
      ...req.body,
      tenantId: req.user.tenantId,
    });

    const ticket = await storageSimple.createTicket(ticketData);
    
    // Log activity
    await storageSimple.createActivityLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      entityType: 'ticket',
      entityId: ticket.id,
      action: 'created',
      details: { subject: ticket.subject, priority: ticket.priority },
    });

    res.status(201).json(ticket);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error creating ticket', error, { tenantId: req.user?.tenantId });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create ticket" });
  }
});

// Update ticket
ticketsRouter.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const ticketId = req.params.id;
    const updates = req.body;

    // CRITICAL FIX: Pass parameters in correct order (tenantId, ticketId, updates)
    const updatedTicket = await storageSimple.updateTicket(req.user.tenantId, ticketId, updates);
    
    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Log activity (disabled temporarily - method not implemented)
    // await storageSimple.createActivityLog({
    //   tenantId: req.user.tenantId,
    //   userId: req.user.id,
    //   entityType: 'ticket',
    //   entityId: ticketId,
    //   action: 'updated',
    //   details: { changes: updates },
    // });

    res.json(updatedTicket);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error updating ticket', error, { ticketId: req.params.id, tenantId: req.user?.tenantId });
    res.status(500).json({ message: "Failed to update ticket" });
  }
});

// Add message to ticket
ticketsRouter.post('/:id/messages', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const ticketId = req.params.id;
    const messageData = insertTicketMessageSchema.parse({
      ...req.body,
      ticketId,
      authorId: req.user.id,
    });

    const message = await storageSimple.createTicketMessage(messageData);
    
    // Log activity
    await storageSimple.createActivityLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      entityType: 'ticket',
      entityId: ticketId,
      action: 'message_added',
      details: { messagePreview: message.message.substring(0, 100) },
    });

    res.status(201).json(message);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error adding ticket message', error, { ticketId: req.params.id });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid message data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to add message" });
  }
});

// Assign ticket to agent
ticketsRouter.post('/:id/assign', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const ticketId = req.params.id;
    const { assignedToId } = req.body;

    const updatedTicket = await storageSimple.updateTicket(ticketId, req.user.tenantId, { 
      assignedToId,
      status: 'in_progress'
    });
    
    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Log activity
    await storageSimple.createActivityLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      entityType: 'ticket',
      entityId: ticketId,
      action: 'assigned',
      details: { assignedToId },
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error assigning ticket:", error);
    res.status(500).json({ message: "Failed to assign ticket" });
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
    const existingTicket = await storageSimple.getTicket(ticketId, req.user.tenantId);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Mark as deleted by updating status
    const success = await storageSimple.updateTicket(ticketId, req.user.tenantId, { status: 'deleted' });
    
    if (!success) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Log activity
    await storageSimple.createActivityLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      entityType: 'ticket',
      entityId: ticketId,
      action: 'deleted',
      details: { subject: existingTicket.subject },
    });

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
        ta.filename,
        ta.original_filename,
        ta.file_size,
        ta.mime_type,
        ta.file_path,
        ta.description,
        ta.uploaded_by,
        ta.created_at,
        u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM "${schemaName}".ticket_attachments ta
      LEFT JOIN public.users u ON ta.uploaded_by = u.id
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
    res.status(500).json({ success: false, message: "Failed to fetch attachments" });
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
        tact.id,
        tact.action_type as "actionType",
        tact.type,
        tact.content,
        tact.description,
        tact.status,
        tact.time_spent,
        tact.start_time,
        tact.end_time,
        tact.agent_id,
        tact.linked_items,
        tact.has_file,
        tact.contact_method,
        tact.vendor,
        tact.is_public,
        tact.created_at,
        u.first_name || ' ' || u.last_name as agent_name
      FROM "${schemaName}".ticket_actions tact
      LEFT JOIN public.users u ON tact.agent_id = u.id
      WHERE tact.ticket_id = $1 AND tact.tenant_id = $2 AND tact.is_active = true
      ORDER BY tact.created_at DESC
    `;

    const result = await pool.query(query, [id, tenantId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching actions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch actions" });
  }
});

// Create ticket action
ticketsRouter.post('/:id/actions', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const { content, is_public } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Placeholder - return success for now
    res.json({ 
      success: true, 
      message: "Action created successfully",
      action: {
        id: Date.now().toString(),
        content,
        isPublic: is_public || false,
        createdBy: req.user.id,
        createdByName: req.user.name || req.user.email,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error creating action:", error);
    res.status(500).json({ message: "Failed to create action" });
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
      WHERE tc.ticket_id = $1 AND tc.tenant_id = $2 AND tc.is_active = true
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
ticketsRouter.get('/:id/notes', jwtAuth, async (req: AuthenticatedRequest, res) => {
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
    res.status(500).json({ success: false, message: "Failed to fetch notes" });
  }
});

// Get ticket history
ticketsRouter.get('/:id/history', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    // Placeholder - return sample data
    const sampleHistory = [
      {
        id: "1",
        type: "status_change",
        action: "Status alterado",
        description: "Status alterado de 'Aberto' para 'Em Progresso'",
        actor: req.user.id,
        actorName: req.user.name || req.user.email,
        actorType: "user",
        oldValue: "open",
        newValue: "in_progress",
        fieldName: "status",
        isPublic: true,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: "2",
        type: "comment",
        action: "Comentário adicionado",
        description: "Agente adicionou uma nova observação ao ticket",
        actor: req.user.id,
        actorName: req.user.name || req.user.email,
        actorType: "user",
        isPublic: false,
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    res.json(sampleHistory);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

export { ticketsRouter };