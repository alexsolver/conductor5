/**
 * Customer Module Dependency Setup
 * Clean Architecture - Infrastructure Layer
 * Configures dependency injection for the Customer module
 */

import { container, TOKENS } from '../../../shared/infrastructure/DependencyContainer';
import { DrizzleCustomerRepository } from '../repositories/DrizzleCustomerRepository';
import { DrizzleCustomerCompanyRepository } from '../repositories/DrizzleCustomerCompanyRepository';
import { CreateCustomerUseCase } from '../../application/usecases/CreateCustomerUseCase';
import { GetCustomersUseCase } from '../../application/usecases/GetCustomersUseCase';
import { UpdateCustomerUseCase } from '../../application/usecases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../application/usecases/DeleteCustomerUseCase';
import { CreateCustomerCompanyUseCase } from '../../application/use-cases/CreateCustomerCompanyUseCase';
import { GetCustomerCompaniesUseCase } from '../../application/use-cases/GetCustomerCompaniesUseCase';
import { UpdateCustomerCompanyUseCase } from '../../application/use-cases/UpdateCustomerCompanyUseCase';
import { ManageCustomerCompanyMembershipUseCase } from '../../application/use-cases/ManageCustomerCompanyMembershipUseCase';
import { CustomerApplicationService } from '../../application/services/CustomerApplicationService';
import { CustomerController } from '../../application/controllers/CustomerController';
import { CustomerCompanyController } from '../../application/controllers/CustomerCompanyController';
import { DomainEventPublisher } from '../../../shared/infrastructure/DomainEventPublisher';

export function setupCustomerDependencies(): void {
  // Register repositories
  container.registerSingleton(TOKENS.CUSTOMER_REPOSITORY, () => new DrizzleCustomerRepository());
  container.registerSingleton(TOKENS.CUSTOMER_COMPANY_REPOSITORY, () => new DrizzleCustomerCompanyRepository());

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

  // Register customer company use cases
  container.register(TOKENS.CREATE_CUSTOMER_COMPANY_USE_CASE, () => new CreateCustomerCompanyUseCase(
    container.resolve(TOKENS.CUSTOMER_COMPANY_REPOSITORY)
  ));

  container.register(TOKENS.GET_CUSTOMER_COMPANIES_USE_CASE, () => new GetCustomerCompaniesUseCase(
    container.resolve(TOKENS.CUSTOMER_COMPANY_REPOSITORY)
  ));

  container.register(TOKENS.UPDATE_CUSTOMER_COMPANY_USE_CASE, () => new UpdateCustomerCompanyUseCase(
    container.resolve(TOKENS.CUSTOMER_COMPANY_REPOSITORY)
  ));

  container.register(TOKENS.MANAGE_CUSTOMER_COMPANY_MEMBERSHIP_USE_CASE, () => new ManageCustomerCompanyMembershipUseCase(
    container.resolve(TOKENS.CUSTOMER_COMPANY_REPOSITORY)
  ));

  // Register application service
  container.register(TOKENS.CUSTOMER_APPLICATION_SERVICE, () => new CustomerApplicationService(
    container.resolve(TOKENS.CREATE_CUSTOMER_USE_CASE),
    container.resolve(TOKENS.GET_CUSTOMERS_USE_CASE),
    container.resolve(TOKENS.UPDATE_CUSTOMER_USE_CASE),
    container.resolve(TOKENS.DELETE_CUSTOMER_USE_CASE)
  ));

  // Register customer company controller
  container.registerSingleton(TOKENS.CUSTOMER_COMPANY_CONTROLLER, () => new CustomerCompanyController(
    container.resolve(TOKENS.CREATE_CUSTOMER_COMPANY_USE_CASE),
    container.resolve(TOKENS.GET_CUSTOMER_COMPANIES_USE_CASE),
    container.resolve(TOKENS.UPDATE_CUSTOMER_COMPANY_USE_CASE),
    container.resolve(TOKENS.MANAGE_CUSTOMER_COMPANY_MEMBERSHIP_USE_CASE)
  ));
}

export function getCustomerController(): CustomerController {
  // Ensure dependencies are set up before resolving
  if (!container.isRegistered(TOKENS.CUSTOMER_APPLICATION_SERVICE)) {
    setupCustomerDependencies();
  }
  return new CustomerController(
    container.resolve(TOKENS.CUSTOMER_APPLICATION_SERVICE)
  );
}

export function getCustomerCompanyController(): CustomerCompanyController {
  // Ensure dependencies are set up before resolving
  if (!container.isRegistered(TOKENS.CUSTOMER_COMPANY_CONTROLLER)) {
    setupCustomerDependencies();
  }
  return container.resolve(TOKENS.CUSTOMER_COMPANY_CONTROLLER);
}