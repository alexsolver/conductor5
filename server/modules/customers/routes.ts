// Customers Microservice Routes - JWT Authentication
import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../../middleware/jwtAuth";
import { CustomerController } from "../../application/controllers/CustomerController";
import { storage } from "../../storage";
import { insertCustomerSchema } from "../../../shared/schema";
import { z } from "zod";

const customersRouter = Router();
const customerController = new CustomerController();

// Get all customers with pagination
customersRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await customerController.getCustomers(req, res);
});

// Get customer by ID
customersRouter.get('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await customerController.getCustomer(req, res);
});

// Create new customer
customersRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await customerController.createCustomer(req, res);
});

// Update customer
customersRouter.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const customerId = req.params.id;
    const updates = req.body;

    const updatedCustomer = await storage.updateCustomer(customerId, req.user.tenantId, updates);
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Log activity
    await storage.createActivityLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      entityType: 'customer',
      entityId: customerId,
      action: 'updated',
      details: { changes: updates },
    });

    res.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Failed to update customer" });
  }
});

// Delete customer
customersRouter.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const customerId = req.params.id;
    const success = await storage.deleteCustomer(customerId, req.user.tenantId);
    
    if (!success) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Log activity
    await storage.createActivityLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      entityType: 'customer',
      entityId: customerId,
      action: 'deleted',
      details: {},
    });

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Failed to delete customer" });
  }
});

// Search customers
customersRouter.get('/search/:query', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const query = req.params.query;
    const customers = await storage.getCustomers(req.user.tenantId, 100, 0);
    
    // Simple search implementation
    const filteredCustomers = customers.filter(customer => 
      customer.firstName?.toLowerCase().includes(query.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(query.toLowerCase()) ||
      customer.email.toLowerCase().includes(query.toLowerCase()) ||
      customer.company?.toLowerCase().includes(query.toLowerCase())
    );

    res.json(filteredCustomers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Failed to search customers" });
  }
});

export { customersRouter };