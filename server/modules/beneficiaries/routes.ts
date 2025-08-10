import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { tenantValidator } from '../../middleware/tenantValidator';
import { BeneficiaryController } from './application/controllers/BeneficiaryController';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);
router.use(tenantValidator);

// CLEANED: Rotas focam apenas em roteamento HTTP - use cases instanciados com dependências adequadas
import { DrizzleBeneficiaryRepository } from './infrastructure/repositories/DrizzleBeneficiaryRepository';

// Dependency injection setup - moved from routes to proper DI container 
const beneficiaryRepository = new DrizzleBeneficiaryRepository();

// Import and properly instantiate use cases with repositories
import { CreateBeneficiaryUseCase } from './application/use-cases/CreateBeneficiaryUseCase';
import { GetBeneficiariesUseCase } from './application/use-cases/GetBeneficiariesUseCase';
import { UpdateBeneficiaryUseCase } from './application/use-cases/UpdateBeneficiaryUseCase';
import { DeleteBeneficiaryUseCase } from './application/use-cases/DeleteBeneficiaryUseCase';

const createBeneficiaryUseCase = new CreateBeneficiaryUseCase(beneficiaryRepository);
const getBeneficiariesUseCase = new GetBeneficiariesUseCase(beneficiaryRepository);
const updateBeneficiaryUseCase = new UpdateBeneficiaryUseCase(beneficiaryRepository);
const deleteBeneficiaryUseCase = new DeleteBeneficiaryUseCase(beneficiaryRepository);

const beneficiaryController = new BeneficiaryController(
  createBeneficiaryUseCase,
  getBeneficiariesUseCase,
  updateBeneficiaryUseCase,
  deleteBeneficiaryUseCase
);

// Rotas CRUD - delegando para controllers
router.get('/', beneficiaryController.getAll.bind(beneficiaryController));
router.get('/:id', beneficiaryController.getById.bind(beneficiaryController));
router.post('/', beneficiaryController.create.bind(beneficiaryController));
router.put('/:id', beneficiaryController.update.bind(beneficiaryController));
router.delete('/:id', beneficiaryController.delete.bind(beneficiaryController));

// Rotas relacionadas a clientes
router.get('/:id/customers', beneficiaryController.getBeneficiaryCustomers.bind(beneficiaryController));
router.post('/:id/customers', beneficiaryController.addBeneficiaryCustomer.bind(beneficiaryController));
router.delete('/:id/customers/:customerId', beneficiaryController.removeBeneficiaryCustomer.bind(beneficiaryController));

// Rotas relacionadas a localizações
router.get('/:id/locations', beneficiaryController.getBeneficiaryLocations.bind(beneficiaryController));
router.post('/:id/locations', beneficiaryController.addBeneficiaryLocation.bind(beneficiaryController));
router.delete('/:id/locations/:locationId', beneficiaryController.removeBeneficiaryLocation.bind(beneficiaryController));
router.put('/:id/locations/:locationId/primary', beneficiaryController.updateBeneficiaryLocationPrimary.bind(beneficiaryController));

export default router;