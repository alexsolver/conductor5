import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { tenantValidator } from '../../middleware/tenantValidator';
import { CustomerController } from './application/controllers/CustomerController';
import { CustomerApplicationService } from './application/services/CustomerApplicationService';
import { DrizzleCustomerRepository } from './infrastructure/repositories/CustomerRepository';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);
router.use(tenantValidator());

// Inicializar dependencies and controller
const customerRepository = new DrizzleCustomerRepository();
const customerApplicationService = new CustomerApplicationService();
const customerController = new CustomerController(customerApplicationService, customerRepository);

// Rotas CRUD - delegando para controllers
router.get('/', customerController.getAll.bind(customerController));
router.get('/:id', customerController.getById.bind(customerController));
router.post('/', customerController.create.bind(customerController));
router.put('/:id', customerController.update.bind(customerController));
router.delete('/:id', customerController.delete.bind(customerController));

export default router;