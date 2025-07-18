// Tickets Microservice Routes - JWT Authentication
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { storage } from "../../storage";
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
    let tickets = await storage.getTickets(req.user.tenantId, limit, offset);

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

    const ticket = await storage.getTicket(req.params.id, req.user.tenantId);
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

    const urgentTickets = await storage.getUrgentTickets(req.user.tenantId);
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

    const ticket = await storage.createTicket(ticketData);
    
    // Log activity
    await storage.createActivityLog({
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

    const updatedTicket = await storage.updateTicket(ticketId, req.user.tenantId, updates);
    
    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Log activity
    await storage.createActivityLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      entityType: 'ticket',
      entityId: ticketId,
      action: 'updated',
      details: { changes: updates },
    });

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

    const message = await storage.createTicketMessage(messageData);
    
    // Log activity
    await storage.createActivityLog({
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

    const updatedTicket = await storage.updateTicket(ticketId, req.user.tenantId, { 
      assignedToId,
      status: 'in_progress'
    });
    
    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Log activity
    await storage.createActivityLog({
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
    const existingTicket = await storage.getTicket(ticketId, req.user.tenantId);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Mark as deleted by updating status
    const success = await storage.updateTicket(ticketId, req.user.tenantId, { status: 'deleted' });
    
    if (!success) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Log activity
    await storage.createActivityLog({
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

export { ticketsRouter };