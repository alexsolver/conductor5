// ✅ 1QA.MD COMPLIANCE: Contract Routes - Clean Architecture Presentation Layer
// HTTP routing following exact patterns from existing modules

import { Router } from 'express';
import { ContractController } from './application/controllers/ContractController';
import { DrizzleContractRepository } from './infrastructure/repositories/DrizzleContractRepository';
import { ContractDomainService } from './domain/services/ContractDomainService';
import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';

const router = Router();

// ✅ Dependency Injection - Clean Architecture Pattern
const contractRepository = new DrizzleContractRepository();
const contractDomainService = new ContractDomainService();
const contractController = new ContractController(contractRepository, contractDomainService);

// ✅ All routes require authentication
router.use(jwtAuth);

// ✅ Contract CRUD Routes
router.post('/', (req, res) => contractController.create(req, res));
router.get('/', (req, res) => contractController.list(req, res));
router.get('/summary', (req, res) => contractController.getSummary(req, res));
router.get('/expiring', (req, res) => contractController.getExpiring(req, res));
router.get('/:id', (req, res) => contractController.getById(req, res));
router.put('/:id', (req, res) => contractController.update(req, res));
router.delete('/:id', (req, res) => contractController.delete(req, res));

console.log('✅ [CONTRACT-MANAGEMENT] Routes registered successfully at /api/contracts');

export default router;