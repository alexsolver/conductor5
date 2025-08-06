// personalizationRoutes.ts - Routes for hierarchical item personalization
import { Router } from 'express';
import { jwtAuth } from '../../../middleware/jwtAuth.js';
import {
  getCustomerPersonalizations,
  createCustomerPersonalization,
  getSupplierLinks,
  createSupplierLink,
  getCustomerContextItems,
  getSupplierContextItems
} from '../application/controllers/PersonalizationController.js';

const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Customer Personalization Routes
router.get('/customers/:customerId/personalizations', getCustomerPersonalizations);
router.get('/customers/:customerId/items', getCustomerContextItems);
router.post('/items/:itemId/customer-personalizations', createCustomerPersonalization);

// Supplier Link Routes  
router.get('/suppliers/:supplierId/links', getSupplierLinks);
router.get('/suppliers/:supplierId/items', getSupplierContextItems);
router.post('/items/:itemId/supplier-links', createSupplierLink);

export { router as personalizationRoutes };