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
// GET /api/customers/companies
router.get('/companies', jwtAuth, async (req, res) => {
  try {
    const companies = await getCompaniesUseCase.execute(req.user.tenantId);

    // Ensure consistent response format
    const companiesArray = Array.isArray(companies) ? companies : [];

    console.log(`✅ Companies fetched for tenant ${req.user.tenantId}:`, companiesArray.length);

    res.json({
      success: true,
      data: companiesArray,
      total: companiesArray.length
    });
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch companies',
      data: []
    });
  }
});
router.post('/companies', jwtAuth, (req, res) => companyController.createCompany(req, res));

export { router as customersRouter };