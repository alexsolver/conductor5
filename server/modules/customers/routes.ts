import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { tenantValidator } from '../../middleware/tenantValidator';
import { CustomerController } from './application/controllers/CustomerController';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);
router.use(tenantValidator);

// Dummy implementations for dependencies (temporary fix)
const customerApplicationService = {
  createCustomer: async (data: any) => ({ customer: data }),
  getCustomers: async (params: any) => ({ success: true, customers: [], total: 0 }),
  updateCustomer: async (data: any) => ({ success: true, customer: data }),
  deleteCustomer: async (data: any) => ({ success: true })
};

const customerRepository = {};

// Inicializar controller
const customerController = new CustomerController(customerApplicationService, customerRepository);

// Rotas CRUD - delegando para controllers
router.get('/', customerController.getAll.bind(customerController));
router.get('/:id', customerController.getById.bind(customerController));
router.post('/', customerController.create.bind(customerController));
router.put('/:id', customerController.update.bind(customerController));
router.delete('/:id', customerController.delete.bind(customerController));

export default router;