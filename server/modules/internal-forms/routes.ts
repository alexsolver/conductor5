
/**
 * Internal Forms Routes - Phase 10 Implementation
 * 
 * Rotas para o módulo de Internal Forms
 * Segue padrões estabelecidos no 1qa.md para Clean Architecture
 * 
 * @module InternalFormRoutes
 * @version 1.0.0
 * @created 2025-09-24 - Phase 10 Clean Architecture Implementation
 */

import { Router } from 'express';
import { InternalFormController } from './application/controllers/InternalFormController';
import { DrizzleInternalFormRepository } from './infrastructure/repositories/DrizzleInternalFormRepository';
import { DrizzleCustomerRepository } from '../customers/infrastructure/repositories/DrizzleCustomerRepository';
import { enhancedTenantValidator } from '../../middleware/tenantValidator';

const router = Router();

// ✅ 1QA.MD COMPLIANCE: Repository and Controller instantiation
const internalFormRepository = new DrizzleInternalFormRepository();
const customerRepository = new DrizzleCustomerRepository();
const internalFormController = new InternalFormController(internalFormRepository, customerRepository);

// ✅ Apply tenant validation middleware (authentication is already handled globally)
router.use(enhancedTenantValidator());

// ===== FORM ROUTES =====

/**
 * GET /api/internal-forms/forms
 * Get all forms for the authenticated user's tenant
 */
router.get('/forms', (req, res) => internalFormController.getForms(req, res));

/**
 * GET /api/internal-forms/forms/by-action-type/:actionType
 * Get forms associated with a specific action type
 */
router.get('/forms/by-action-type/:actionType', (req, res) => internalFormController.getFormsByActionType(req, res));

/**
 * GET /api/internal-forms/forms/:formId/ai-context
 * Get AI metadata for automated form filling
 * Returns field instructions, validation hints, and auto-actions for AI agents
 */
router.get('/forms/:formId/ai-context', (req, res) => internalFormController.getAIContext(req, res));

/**
 * GET /api/internal-forms/forms/:id
 * Get a specific form by ID
 */
router.get('/forms/:id', (req, res) => internalFormController.getFormById(req, res));

/**
 * POST /api/internal-forms/forms
 * Create a new form
 */
router.post('/forms', (req, res) => internalFormController.createForm(req, res));

/**
 * PUT /api/internal-forms/forms/:id
 * Update an existing form
 */
router.put('/forms/:id', (req, res) => internalFormController.updateForm(req, res));

/**
 * DELETE /api/internal-forms/forms/:id
 * Delete a form (soft delete)
 */
router.delete('/forms/:id', (req, res) => internalFormController.deleteForm(req, res));

// ===== CATEGORY ROUTES =====

/**
 * GET /api/internal-forms/categories
 * Get all categories for the authenticated user's tenant
 */
router.get('/categories', (req, res) => internalFormController.getCategories(req, res));

// ===== SUBMISSION ROUTES =====

/**
 * GET /api/internal-forms/submissions
 * Get all submissions (optionally filtered by formId)
 */
router.get('/submissions', (req, res) => internalFormController.getSubmissions(req, res));

/**
 * POST /api/internal-forms/submissions
 * Create a new form submission
 */
router.post('/submissions', (req, res) => internalFormController.createSubmission(req, res));

// ===== ENTITY ROUTES (Search or Create) =====

/**
 * POST /api/internal-forms/entity/search-or-create
 * Search for an entity or create it if not found (used by AI during form filling)
 */
router.post('/entity/search-or-create', (req, res) => internalFormController.searchOrCreateEntity(req, res));

/**
 * POST /api/internal-forms/submit-ticket-form
 * Submit ticket form with automatic client/location creation and ticket generation
 * Returns ticket number for AI agent response
 */
router.post('/submit-ticket-form', (req, res) => internalFormController.submitTicketForm(req, res));

export default router;
