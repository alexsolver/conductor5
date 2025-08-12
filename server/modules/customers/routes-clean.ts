/**
 * PRESENTATION LAYER - CUSTOMER ROUTES
 * Seguindo Clean Architecture - 1qa.md compliance
 * 
 * Nova implementação Clean Architecture para Customers
 * Mantém compatibilidade com APIs existentes
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { CustomerController } from './application/controllers/CustomerController';
import { CreateCustomerUseCase } from './application/use-cases/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from './application/use-cases/UpdateCustomerUseCase';
import { FindCustomerUseCase } from './application/use-cases/FindCustomerUseCase';
import { DeleteCustomerUseCase } from './application/use-cases/DeleteCustomerUseCase';
import { CustomerDomainService } from './domain/entities/Customer';
import { DrizzleCustomerRepository } from './infrastructure/repositories/DrizzleCustomerRepository';

// Factory function to create initialized controller
function createCustomerController(): CustomerController {
  // Infrastructure Layer
  const customerRepository = new DrizzleCustomerRepository();
  
  // Domain Layer
  const customerDomainService = new CustomerDomainService();
  
  // Application Layer - Use Cases
  const createCustomerUseCase = new CreateCustomerUseCase(customerRepository, customerDomainService);
  const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepository, customerDomainService);
  const findCustomerUseCase = new FindCustomerUseCase(customerRepository, customerDomainService);
  const deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepository);
  
  // Controller
  return new CustomerController(
    createCustomerUseCase,
    updateCustomerUseCase,
    findCustomerUseCase,
    deleteCustomerUseCase,
    customerDomainService
  );
}

// Initialize controller
const customerController = createCustomerController();

// Router setup
const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

/**
 * @route   GET /api/customers
 * @desc    Get all customers with filtering, pagination, and search
 * @access  Private (JWT required)
 * @params  query parameters for filtering:
 *          - customerType: array of types (PF, PJ)
 *          - isActive: boolean (default: true)
 *          - state: state filter (BR state codes)
 *          - city: city filter
 *          - search: text search in name/email/company/cpf/cnpj
 *          - dateFrom: start date (ISO string)
 *          - dateTo: end date (ISO string)
 *          - page: page number (default: 1)
 *          - limit: items per page (default: 50, max: 1000)
 *          - sortBy: field to sort by (default: firstName)
 *          - sortOrder: asc/desc (default: asc)
 */
router.get('/', customerController.findAll.bind(customerController));

/**
 * @route   GET /api/customers/search
 * @desc    Search customers by text
 * @access  Private (JWT required)
 * @params  q (query parameter): search term
 */
router.get('/search', customerController.search.bind(customerController));

/**
 * @route   GET /api/customers/stats
 * @desc    Get customer statistics for dashboard
 * @access  Private (JWT required)
 */
router.get('/stats', customerController.getStatistics.bind(customerController));

/**
 * @route   GET /api/customers/type/:type
 * @desc    Get customers by type (PF or PJ)
 * @access  Private (JWT required)
 */
router.get('/type/:type', customerController.findByType.bind(customerController));

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID
 * @access  Private (JWT required)
 */
router.get('/:id', customerController.findById.bind(customerController));

/**
 * @route   GET /api/customers/:id/profile
 * @desc    Get customer profile by ID
 * @access  Private (JWT required)
 */
router.get('/:id/profile', customerController.getProfile.bind(customerController));

/**
 * @route   POST /api/customers
 * @desc    Create new customer
 * @access  Private (JWT required)
 * @body    CreateCustomerDTO
 */
router.post('/', customerController.create.bind(customerController));

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer by ID
 * @access  Private (JWT required)
 * @body    UpdateCustomerDTO
 */
router.put('/:id', customerController.update.bind(customerController));

/**
 * @route   DELETE /api/customers/:id
 * @desc    Soft delete customer by ID
 * @access  Private (JWT required)
 */
router.delete('/:id', customerController.delete.bind(customerController));

export default router;