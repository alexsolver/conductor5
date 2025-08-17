/**
 * Contract Routes - Rotas do módulo de contratos
 * Seguindo Clean Architecture e 1qa.md compliance
 */

import { Router } from 'express';
import { ContractController } from '../application/controllers/ContractController';
import { ContractApplicationService } from '../application/services/ContractApplicationService';
import { DrizzleContractRepository } from '../infrastructure/repositories/DrizzleContractRepository';

// Configurar dependências
const contractRepository = new DrizzleContractRepository();
const contractApplicationService = new ContractApplicationService(contractRepository);
const contractController = new ContractController(contractApplicationService);

const router = Router();

// Rotas principais de contratos
router.get('/', contractController.getContracts.bind(contractController));
router.get('/dashboard-metrics', contractController.getDashboardMetrics.bind(contractController));
router.get('/financial-summary', contractController.getFinancialSummary.bind(contractController));
router.get('/:id', contractController.getContractById.bind(contractController));
router.post('/', contractController.createContract.bind(contractController));
router.put('/:id', contractController.updateContract.bind(contractController));
router.delete('/:id', contractController.deleteContract.bind(contractController));

export default router;