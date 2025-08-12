/**
 * Beneficiary Routes - Clean Architecture
 * 
 * RESTful API endpoints for beneficiary operations following Clean Architecture principles.
 * Implements proper dependency injection and error handling patterns.
 * 
 * @module BeneficiaryRoutesClean
 * @version 1.0.0
 * @created 2025-01-12 - Phase 7 Clean Architecture Implementation
 */

import { Router } from 'express';
import { BeneficiaryController } from './application/controllers/BeneficiaryController';
import { CreateBeneficiaryUseCase } from './application/use-cases/CreateBeneficiaryUseCase';
import { FindBeneficiaryUseCase } from './application/use-cases/FindBeneficiaryUseCase';
import { UpdateBeneficiaryUseCase } from './application/use-cases/UpdateBeneficiaryUseCase';
import { DeleteBeneficiaryUseCase } from './application/use-cases/DeleteBeneficiaryUseCase';
import { SimplifiedBeneficiaryRepository } from './infrastructure/repositories/SimplifiedBeneficiaryRepository';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();

// Initialize dependencies (Dependency Injection)
const beneficiaryRepository = new SimplifiedBeneficiaryRepository();
const createBeneficiaryUseCase = new CreateBeneficiaryUseCase(beneficiaryRepository);
const findBeneficiaryUseCase = new FindBeneficiaryUseCase(beneficiaryRepository);
const updateBeneficiaryUseCase = new UpdateBeneficiaryUseCase(beneficiaryRepository);
const deleteBeneficiaryUseCase = new DeleteBeneficiaryUseCase(beneficiaryRepository);

// Initialize controller
const beneficiaryController = new BeneficiaryController(
  createBeneficiaryUseCase,
  findBeneficiaryUseCase,
  updateBeneficiaryUseCase,
  deleteBeneficiaryUseCase
);

// Apply authentication middleware to all routes
router.use(jwtAuth);

// ===== CORE CRUD OPERATIONS =====

/**
 * Create a new beneficiary
 * POST /v2/
 */
router.post('/v2/', (req, res) => beneficiaryController.create(req, res));

/**
 * Get beneficiary by ID
 * GET /v2/:id
 */
router.get('/v2/:id', (req, res) => beneficiaryController.findById(req, res));

/**
 * List beneficiaries with filtering and pagination
 * GET /v2/
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search across name, email, cpf, phone)
 * - customerCode: string
 * - customerId: string
 * - city: string
 * - state: string
 * - isActive: boolean
 * - hasEmail: boolean
 * - hasPhone: boolean
 * - hasCpf: boolean
 * - hasCnpj: boolean
 * - birthDateFrom: Date
 * - birthDateTo: Date
 * - createdFrom: Date
 * - createdTo: Date
 * - sortBy: string (name|email|createdAt|updatedAt)
 * - sortOrder: string (asc|desc)
 */
router.get('/v2/', (req, res) => beneficiaryController.findMany(req, res));

/**
 * Update beneficiary
 * PUT /v2/:id
 */
router.put('/v2/:id', (req, res) => beneficiaryController.update(req, res));

/**
 * Delete beneficiary (soft delete)
 * DELETE /v2/:id
 */
router.delete('/v2/:id', (req, res) => beneficiaryController.delete(req, res));

// ===== SEARCH AND FILTERING =====

/**
 * Search beneficiaries by text
 * GET /v2/search?q=searchTerm&limit=20&offset=0
 */
router.get('/v2/search', (req, res) => beneficiaryController.search(req, res));

/**
 * Find beneficiary by CPF
 * GET /v2/cpf/:cpf
 */
router.get('/v2/cpf/:cpf', (req, res) => beneficiaryController.findByCpf(req, res));

/**
 * Find beneficiaries by customer ID
 * GET /v2/customer/:customerId
 */
router.get('/v2/customer/:customerId', (req, res) => beneficiaryController.findByCustomerId(req, res));

// ===== STATISTICS AND ANALYTICS =====

/**
 * Get beneficiary statistics
 * GET /v2/stats
 */
router.get('/v2/stats', (req, res) => beneficiaryController.getStats(req, res));

/**
 * Get recent beneficiaries
 * GET /v2/recent?days=30&limit=10
 */
router.get('/v2/recent', (req, res) => beneficiaryController.getRecent(req, res));

// ===== BULK OPERATIONS =====

/**
 * Bulk delete beneficiaries
 * DELETE /v2/bulk
 * Body: { ids: string[] }
 */
router.delete('/v2/bulk', (req, res) => beneficiaryController.bulkDelete(req, res));

export default router;