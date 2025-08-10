// Tickets Microservice Routes - JWT Authentication
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
// import { storageSimple } from "../../storage-simple"; // TODO: Remove storage dependency from routes
import { insertTicketSchema, insertTicketMessageSchema } from '@shared/schema';
import { sendSuccess, sendError, sendValidationError } from "../../utils/standardResponse";
import { mapFrontendToBackend } from "../../utils/fieldMapping";
import { z } from "zod";
import { trackTicketView, trackTicketEdit, trackNoteView, trackNoteCreate, trackTicketCreate } from '../../middleware/activityTrackingMiddleware';

// Controllers - Business logic is now encapsulated here
import { TicketController } from './application/controllers/TicketController';

// Generate unique action number for internal actions
async function generateActionNumber(pool: any, tenantId: string, ticketId: string): Promise<string> {
  try {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

    // Get ticket number
    const ticketQuery = `SELECT number FROM "${schemaName}".tickets WHERE id = $1`;
    const ticketResult = await pool.query(ticketQuery, [ticketId]);

    if (!ticketResult.rows.length) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const ticketNumber = ticketResult.rows[0].number;

    // Get next sequence number
    const sequenceQuery = `
      SELECT COALESCE(MAX(CAST(SUBSTRING(action_number FROM '${ticketNumber}AI\\d+)') AS INTEGER)), 0) + 1 as next_seq
      FROM "${schemaName}".ticket_internal_actions 
      WHERE ticket_id = $1 AND tenant_id = $2 
      AND action_number ~ '^${ticketNumber}AI\\d+$'
    `;

    const sequenceResult = await pool.query(sequenceQuery, [ticketId, tenantId]);
    const nextSequence = sequenceResult.rows[0]?.next_seq || 1;

    const actionNumber = `${ticketNumber}AI${String(nextSequence).padStart(4, '0')}`;
    console.log(`✅ Generated action number: ${actionNumber}`);
    return actionNumber;

  } catch (error) {
    console.error('⚠️ Error generating action number:', error);
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

    // Get user name with null check
    const userQuery = `SELECT first_name || ' ' || last_name as full_name FROM public.users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [req.user?.id]);
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
      req.user?.id,
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
const ticketController = new TicketController();

// Apply middleware
ticketsRouter.use(jwtAuth);
// ticketsRouter.use(enhancedTenantValidator()); // Assuming this is another middleware not provided

// Debug middleware for tickets
ticketsRouter.use((req: any, res, next) => {
  console.log('🎫 [TICKETS-ROUTES] Request context:', {
    path: req.path,
    method: req.method,
    hasUser: !!req.user,
    tenantId: req.user?.tenantId,
    userId: req.user?.id
  });
  next();
});

// Get all tickets (main endpoint)
ticketsRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🎫 [TICKETS-ROUTES] GET / called');

    if (!req.user?.tenantId) {
      console.error('❌ [TICKETS-ROUTES] No tenantId found');
      return res.status(400).json({
        success: false,
        error: 'User not associated with a tenant',
        data: { tickets: [] }
      });
    }

    const {
      page = '1',
      limit = '50',
      search,
      status,
      priority,
      assignedToId,
      companyId
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string,
      status: status as string,
      priority: priority as string,
      assignedToId: assignedToId as string,
      companyId: companyId as string
    };

    console.log('🎫 [TICKETS-ROUTES] Fetching tickets with options:', options);

    // Delegate to controller
    await ticketController.getAllTickets(req, res);

  } catch (error: any) {
    console.error('❌ [TICKETS-ROUTES] Error in GET /:', error);
    const { logError } = await import('../../utils/logger');
    logError('Error fetching tickets', error, { tenantId: req.user?.tenantId });

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tickets',
      data: { tickets: [] }
    });
  }
});

// Get urgent tickets (filtered from all tickets)
ticketsRouter.get('/urgent', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }
    // Delegate to controller
    await ticketController.getUrgentTickets(req, res);
  } catch (error) {
    const { logError } = await import('../../utils/logger');
    logError('Error fetching urgent tickets', error, { tenantId: req.user?.tenantId });
    return sendError(res, error, "Failed to fetch urgent tickets", 500);
  }
});

// Create new ticket
ticketsRouter.post('/', trackTicketCreate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.createTicket(req, res);
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

// ✅ CORREÇÃO: Update ticket com validação completa e auditoria robusta
ticketsRouter.put('/:id', jwtAuth, trackTicketEdit, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }
    // Delegate to controller
    await ticketController.updateTicket(req, res);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ CRITICAL ERROR updating ticket:', {
      ticketId: req.params.id,
      error: err.message,
      stack: err.stack,
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      updates: Object.keys(req.body)
    });

    const { logError } = await import('../../utils/logger');
    logError('Error updating ticket', err, { 
      ticketId: req.params.id, 
      tenantId: req.user?.tenantId,
      updateFields: Object.keys(req.body),
      errorType: err.constructor.name
    });

    // ✅ RESPOSTA DE ERRO DETALHADA PARA DEBUG
    return sendError(res, {
      message: err.message,
      type: err.constructor.name,
      ticketId: req.params.id,
      timestamp: new Date().toISOString()
    }, "Failed to update ticket - check logs for details", 500);
  }
});

// Get single ticket by ID
ticketsRouter.get('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Ensure JSON content type
    res.setHeader('Content-Type', 'application/json');

    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'User not associated with a tenant',
        data: null
      });
    }
    // Delegate to controller
    await ticketController.getTicketById(req, res);

  } catch (error: any) {
    console.error(`❌ [TICKETS-ROUTES] Error fetching ticket ${req.params.id}:`, error);

    // Ensure JSON response even on error
    res.setHeader('Content-Type', 'application/json');

    const { logError } = await import('../../utils/logger');
    logError('Error fetching ticket', error, { 
      ticketId: req.params.id, 
      tenantId: req.user?.tenantId 
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ticket',
      data: null,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add message to ticket - CORREÇÃO PROBLEMA 5: Padronização de middleware jwtAuth
ticketsRouter.post('/:id/messages', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return sendError(res, "User not associated with a tenant", "User not associated with a tenant", 400);
    }
    // Delegate to controller
    await ticketController.addMessageToTicket(req, res);
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
    // Delegate to controller
    await ticketController.assignTicket(req, res);
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
    // Delegate to controller
    await ticketController.deleteTicket(req, res);
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
    // Delegate to controller
    await ticketController.getTicketAttachments(req, res);
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
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv', 'application/json',
      'video/mp4', 'video/avi', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/mp3'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

ticketsRouter.post('/:id/attachments', jwtAuth, upload.array('attachments', 5), async (req: any, res) => {
  console.log('🚀 TICKETS MODULE ATTACHMENT UPLOAD STARTED');
  console.log('🔍 Request params:', req.params);
  console.log('🔍 Request body:', req.body);
  console.log('🔍 Files received:', req.files ? req.files.length : 0);

  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.uploadTicketAttachment(req, res);
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to upload attachment",
      error: error.message
    });
  }
});

// Delete ticket attachment
ticketsRouter.delete('/:id/attachments/:attachmentId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.deleteTicketAttachment(req, res);
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ message: "Failed to delete attachment" });
  }
});

// Get ticket actions (Internal Actions ONLY - from ticket_internal_actions table)
ticketsRouter.get('/:id/actions', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.getInternalActions(req, res);
  } catch (error) {
    console.error("Error fetching internal actions:", error);
    // Return empty array instead of 500 error to prevent frontend crashes
    res.json({
      success: true,
      data: [],
      count: 0
    });
  }
});

// Get single internal action for editing (from ticket_internal_actions table only)
ticketsRouter.get('/:ticketId/actions/:actionId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.getInternalActionById(req, res);
  } catch (error) {
    console.error("Error fetching internal action for edit:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch internal action" 
    });
  }
});

// Create ticket action
ticketsRouter.post('/:id/actions', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.createInternalAction(req, res);
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
    // Delegate to controller
    await ticketController.getTicketCommunications(req, res);
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
    // Delegate to controller
    await ticketController.getTicketEmails(req, res);
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
    // Delegate to controller
    await ticketController.sendTicketEmail(req, res);
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

// ✅ AUDITORIA FALTANTE: Visualização de ticket
ticketsRouter.post('/:id/views', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.recordTicketView(req, res);
  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({ message: "Failed to record view" });
  }
});

// ✅ AUDITORIA FALTANTE: Mudança de status explícita
ticketsRouter.post('/:id/status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.updateTicketStatus(req, res);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// ✅ AUDITORIA FALTANTE: Reatribuição de ticket
ticketsRouter.post('/:id/reassign', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.reassignTicket(req, res);
  } catch (error) {
    console.error("Error reassigning ticket:", error);
    res.status(500).json({ message: "Failed to reassign ticket" });
  }
});

// Get ticket notes
ticketsRouter.get('/:id/notes', jwtAuth, trackNoteView, async (req: AuthenticatedRequest, res) =>{
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.getTicketNotes(req, res);
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

// Update ticket note
ticketsRouter.put('/:id/notes/:noteId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.updateTicketNote(req, res);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update note",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Delete ticket note
ticketsRouter.delete('/:id/notes/:noteId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.deleteTicketNote(req, res);
  } catch (error) {
    console.error("❌ Error deleting note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete note",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create ticket note - IMPLEMENTAÇÃO REAL
ticketsRouter.post('/:id/notes', jwtAuth, trackNoteCreate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.createTicketNote(req, res);
  } catch (error) {
    console.error("❌ Error creating note:", error);
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
    // Delegate to controller
    await ticketController.getTicketHistory(req, res);
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
    // Delegate to controller
    await ticketController.getTicketRelationships(req, res);
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
    // Delegate to controller
    await ticketController.createTicketRelationship(req, res);
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
    // Delegate to controller
    await ticketController.deleteTicketRelationship(req, res);
  } catch (error) {
    console.error("Error deleting ticket relationship:", error);
    res.status(500).json({ message: "Failed to delete ticket relationship" });
  }
});

// Get internal actions for scheduling (by date range)
ticketsRouter.get('/internal-actions/schedule/:startDate/:endDate', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.getScheduledInternalActions(req, res);
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
    // Delegate to controller
    await ticketController.updateInternalAction(req, res);
  } catch (error) {
    console.error("Error updating internal action:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update internal action",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH Update ticket action - for timer system
ticketsRouter.patch('/:ticketId/actions/:actionId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.patchInternalAction(req, res);
  } catch (error) {
    console.error("Error updating internal action:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update internal action" 
    });
  }
});

// Delete internal action
ticketsRouter.delete('/:ticketId/actions/:actionId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }
    // Delegate to controller
    await ticketController.deleteInternalAction(req, res);
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