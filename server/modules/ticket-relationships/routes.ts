/**
 * Ticket Relationships Routes - Clean Architecture Implementation
 * Following 1qa.md specifications strictly
 * @module TicketRelationshipRoutes
 */

import { Router } from 'express';
import { DrizzleTicketRelationshipRepository } from './infrastructure/repositories/DrizzleTicketRelationshipRepository';
import { FindTicketRelationshipsUseCase } from './application/use-cases/FindTicketRelationshipsUseCase';
import { DeleteTicketRelationshipUseCase } from './application/use-cases/DeleteTicketRelationshipUseCase';
import { TicketRelationshipController } from './application/controllers/TicketRelationshipController';

console.log('🏗️ [TICKET-RELATIONSHIPS-CLEAN-ARCH] Initializing Clean Architecture dependencies...');

// Infrastructure Layer - Repository
const ticketRelationshipRepository = new DrizzleTicketRelationshipRepository();

// Application Layer - Use Cases
const findTicketRelationshipsUseCase = new FindTicketRelationshipsUseCase(ticketRelationshipRepository);
const deleteTicketRelationshipUseCase = new DeleteTicketRelationshipUseCase(ticketRelationshipRepository);

// Application Layer - Controllers
const ticketRelationshipController = new TicketRelationshipController(
  findTicketRelationshipsUseCase,
  deleteTicketRelationshipUseCase
);

// Presentation Layer - Routes
const router = Router();

console.log('🏗️ [TICKET-RELATIONSHIPS-CLEAN-ARCH] Setting up Clean Architecture routes...');

/**
 * GET /api/ticket-relationships/:ticketId/relationships
 * Following 1qa.md Clean Architecture pattern
 */
router.get('/:ticketId/relationships', 
  ticketRelationshipController.getRelationships.bind(ticketRelationshipController)
);

/**
 * GET /api/ticket-relationships/:ticketId/relationships-count
 * Following 1qa.md Clean Architecture pattern
 */
router.get('/:ticketId/relationships-count', 
  ticketRelationshipController.getRelationshipsCount.bind(ticketRelationshipController)
);

/**
 * DELETE /api/ticket-relationships/:relationshipId
 * Following 1qa.md Clean Architecture pattern
 */
router.delete('/:relationshipId', 
  ticketRelationshipController.deleteRelationship.bind(ticketRelationshipController)
);

console.log('✅ [TICKET-RELATIONSHIPS-CLEAN-ARCH] Clean Architecture routes configured successfully');

export default router;