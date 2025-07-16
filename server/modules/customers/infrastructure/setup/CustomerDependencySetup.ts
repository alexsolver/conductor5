/**
 * Customer Module Dependency Setup
 * Clean Architecture - Infrastructure Layer
 * Configures dependency injection for the Customer module
 */

import { container, TOKENS } from '../../../shared/infrastructure/DependencyContainer';
import { DrizzleCustomerRepository } from '../repositories/DrizzleCustomerRepository';
import { CreateCustomerUseCase } from '../../application/usecases/CreateCustomerUseCase';
import { GetCustomersUseCase } from '../../application/usecases/GetCustomersUseCase';
import { UpdateCustomerUseCase } from '../../application/usecases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../application/usecases/DeleteCustomerUseCase';
import { CustomerApplicationService } from '../../application/services/CustomerApplicationService';
import { CustomerController } from '../../application/controllers/CustomerController';
import { DomainEventPublisher } from '../../../shared/infrastructure/DomainEventPublisher';

export function setupCustomerDependencies(): void {
  // Register repository
  container.registerSingleton(TOKENS.CUSTOMER_REPOSITORY, () => new DrizzleCustomerRepository());

  // Register domain event publisher
  container.registerSingleton(TOKENS.DOMAIN_EVENT_PUBLISHER, () => new DomainEventPublisher());

  // Register use cases
  container.register(TOKENS.CREATE_CUSTOMER_USE_CASE, () => new CreateCustomerUseCase(
    container.resolve(TOKENS.CUSTOMER_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER)
  ));

  container.register(TOKENS.GET_CUSTOMERS_USE_CASE, () => new GetCustomersUseCase(
    container.resolve(TOKENS.CUSTOMER_REPOSITORY)
  ));

  container.register(TOKENS.UPDATE_CUSTOMER_USE_CASE, () => new UpdateCustomerUseCase(
    container.resolve(TOKENS.CUSTOMER_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER)
  ));

  container.register(TOKENS.DELETE_CUSTOMER_USE_CASE, () => new DeleteCustomerUseCase(
    container.resolve(TOKENS.CUSTOMER_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER)
  ));

  // Register application service
  container.register(TOKENS.CUSTOMER_APPLICATION_SERVICE, () => new CustomerApplicationService(
    container.resolve(TOKENS.CREATE_CUSTOMER_USE_CASE),
    container.resolve(TOKENS.GET_CUSTOMERS_USE_CASE),
    container.resolve(TOKENS.UPDATE_CUSTOMER_USE_CASE),
    container.resolve(TOKENS.DELETE_CUSTOMER_USE_CASE)
  ));

  // Register controller - not in container as it's created per request
  // But can be accessed via factory function
}

export function getCustomerController(): CustomerController {
  return new CustomerController(
    container.resolve(TOKENS.CUSTOMER_APPLICATION_SERVICE)
  );
}