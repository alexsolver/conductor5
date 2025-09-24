
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
import { authenticateToken } from '../../middleware/jwtAuth';
import { enhancedTenantValidator } from '../../middleware/tenantValidator';

const router = Router();

// ✅ 1QA.MD COMPLIANCE: Repository and Controller instantiation
const internalFormRepository = new DrizzleInternalFormRepository();
const internalFormController = new InternalFormController(internalFormRepository);

// ✅ Apply authentication and tenant validation middleware to all routes
router.use(authenticateToken);
router.use(enhancedTenantValidator());

// ===== FORM ROUTES =====

/**
 * GET /api/internal-forms/forms
 * Get all forms for the authenticated user's tenant
 */
router.get('/forms', (req, res) => internalFormController.getForms(req, res));

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

export default router;
