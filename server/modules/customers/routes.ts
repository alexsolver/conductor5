import { Router } from 'express';
import { CustomerController } from './application/controllers/CustomerController';
import { CompanyController } from './application/controllers/CompanyController';
import { jwtAuth } from '../../middleware/jwtAuth';

const router = Router();
const customerController = new CustomerController();
const companyController = new CompanyController();

// Customer routes
router.get('/', jwtAuth, (req, res) => customerController.getCustomers(req, res));
router.post('/', jwtAuth, (req, res) => customerController.createCustomer(req, res));
router.get('/:id', jwtAuth, (req, res) => customerController.getCustomer(req, res));
router.put('/:id', jwtAuth, (req, res) => customerController.updateCustomer(req, res));

// Company routes
router.get('/companies', jwtAuth, (req, res) => companyController.getCompanies(req, res));
router.post('/companies', jwtAuth, (req, res) => companyController.createCompany(req, res));

export { router as customersRouter };