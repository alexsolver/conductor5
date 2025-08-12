/**
 * PRESENTATION LAYER - TICKET ROUTES
 * Seguindo Clean Architecture - 1qa.md compliance
 * 
 * Nova implementação Clean Architecture para Tickets
 * Mantém compatibilidade com APIs existentes
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { TicketController } from './application/controllers/TicketController';
import { CreateTicketUseCase } from './application/use-cases/CreateTicketUseCase';
import { UpdateTicketUseCase } from './application/use-cases/UpdateTicketUseCase';
import { FindTicketUseCase } from './application/use-cases/FindTicketUseCase';
import { DeleteTicketUseCase } from './application/use-cases/DeleteTicketUseCase';
import { TicketDomainService } from './domain/entities/Ticket';
import { DrizzleTicketRepository } from './infrastructure/repositories/DrizzleTicketRepository';

// Factory function to create initialized controller
function createTicketController(): TicketController {
  // Infrastructure Layer
  const ticketRepository = new DrizzleTicketRepository();
  
  // Domain Layer
  const ticketDomainService = new TicketDomainService();
  
  // Application Layer - Use Cases
  const createTicketUseCase = new CreateTicketUseCase(ticketRepository, ticketDomainService);
  const updateTicketUseCase = new UpdateTicketUseCase(ticketRepository, ticketDomainService);
  const findTicketUseCase = new FindTicketUseCase(ticketRepository, ticketDomainService);
  const deleteTicketUseCase = new DeleteTicketUseCase(ticketRepository);
  
  // Controller
  return new TicketController(
    createTicketUseCase,
    updateTicketUseCase,
    findTicketUseCase,
    deleteTicketUseCase
  );
}

// Initialize controller
const ticketController = createTicketController();

// Router setup
const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

/**
 * @route   GET /api/tickets
 * @desc    Get all tickets with filtering, pagination, and search
 * @access  Private (JWT required)
 * @params  query parameters for filtering:
 *          - status: array of status values
 *          - priority: array of priority values
 *          - assignedToId: assigned user ID
 *          - customerId: customer ID
 *          - companyId: company ID
 *          - category: category filter
 *          - dateFrom: start date (ISO string)
 *          - dateTo: end date (ISO string)
 *          - search: text search in subject/description/number
 *          - page: page number (default: 1)
 *          - limit: items per page (default: 50, max: 1000)
 *          - sortBy: field to sort by (default: createdAt)
 *          - sortOrder: asc/desc (default: desc)
 */
router.get('/', ticketController.findAll.bind(ticketController));

/**
 * @route   GET /api/tickets/search
 * @desc    Search tickets by text
 * @access  Private (JWT required)
 * @params  q (query parameter): search term
 */
router.get('/search', ticketController.search.bind(ticketController));

/**
 * @route   GET /api/tickets/stats
 * @desc    Get ticket statistics for dashboard
 * @access  Private (JWT required)
 */
router.get('/stats', ticketController.getStatistics.bind(ticketController));

/**
 * @route   GET /api/tickets/assigned/:userId
 * @desc    Get tickets assigned to specific user
 * @access  Private (JWT required)
 */
router.get('/assigned/:userId', ticketController.findByAssignedUser.bind(ticketController));

/**
 * @route   GET /api/tickets/customer/:customerId
 * @desc    Get tickets for specific customer
 * @access  Private (JWT required)
 */
router.get('/customer/:customerId', ticketController.findByCustomer.bind(ticketController));

/**
 * @route   GET /api/tickets/:id
 * @desc    Get ticket by ID
 * @access  Private (JWT required)
 */
router.get('/:id', ticketController.findById.bind(ticketController));

/**
 * @route   POST /api/tickets
 * @desc    Create new ticket
 * @access  Private (JWT required)
 * @body    CreateTicketDTO
 */
router.post('/', ticketController.create.bind(ticketController));

/**
 * @route   PUT /api/tickets/:id
 * @desc    Update ticket by ID
 * @access  Private (JWT required)
 * @body    UpdateTicketDTO
 */
router.put('/:id', ticketController.update.bind(ticketController));

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Soft delete ticket by ID
 * @access  Private (JWT required)
 */
router.delete('/:id', ticketController.delete.bind(ticketController));

export default router;