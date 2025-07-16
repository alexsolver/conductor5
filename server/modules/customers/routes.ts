// Customers Module Routes - Clean Architecture
import { Router } from "express";
import { jwtAuth } from "../../middleware/jwtAuth";
import { CustomersController } from "./application/controllers/CustomersController";

const customersRouter = Router();
const customersController = new CustomersController();

// Bind controller methods to maintain 'this' context
customersRouter.get('/', jwtAuth, customersController.getCustomers.bind(customersController));
customersRouter.get('/:id', jwtAuth, customersController.getCustomer.bind(customersController));
customersRouter.post('/', jwtAuth, customersController.createCustomer.bind(customersController));
customersRouter.put('/:id', jwtAuth, customersController.updateCustomer.bind(customersController));
customersRouter.delete('/:id', jwtAuth, customersController.deleteCustomer.bind(customersController));

export { customersRouter };