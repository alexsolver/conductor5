// Customers Microservice Routes
import { Router } from "express";
import { isAuthenticated } from "../../replitAuth";
import { CustomerController } from "../../application/controllers/CustomerController";
import { storage } from "../../storage";
import { insertCustomerSchema } from "../../../shared/schema";
import { z } from "zod";

const customersRouter = Router();
const customerController = new CustomerController();

// Get all customers with pagination
customersRouter.get('/', isAuthenticated, async (req: any, res) => {
  const user = await storage.getUser(req.user.claims.sub);
  req.user = user;
  await customerController.getCustomers(req, res);
});

// Get customer by ID
customersRouter.get('/:id', isAuthenticated, async (req: any, res) => {
  const user = await storage.getUser(req.user.claims.sub);
  req.user = user;
  await customerController.getCustomer(req, res);
});

// Create new customer
customersRouter.post('/', isAuthenticated, async (req: any, res) => {
  const user = await storage.getUser(req.user.claims.sub);
  req.user = user;
  await customerController.createCustomer(req, res);
});

// Update customer
customersRouter.put('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const customerId = req.params.id;
    const updates = req.body;

    const updatedCustomer = await storage.updateCustomer(customerId, user.tenantId, updates);
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Log activity
    await storage.createActivityLog({
      tenantId: user.tenantId,
      userId: user.id,
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
customersRouter.delete('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const customerId = req.params.id;
    const success = await storage.deleteCustomer(customerId, user.tenantId);
    
    if (!success) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Log activity
    await storage.createActivityLog({
      tenantId: user.tenantId,
      userId: user.id,
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
customersRouter.get('/search/:query', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.tenantId) {
      return res.status(400).json({ message: "User not associated with a tenant" });
    }

    const query = req.params.query;
    const customers = await storage.getCustomers(user.tenantId, 100, 0);
    
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