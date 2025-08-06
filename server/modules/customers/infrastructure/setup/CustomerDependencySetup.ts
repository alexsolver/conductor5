/**
 * Customer Module Dependency Setup
 * Clean Architecture - Infrastructure Layer
 * Configures dependency injection for the Customer module
 */

import { container, TOKENS } from '../../../shared/infrastructure/DependencyContainer';
import { DrizzleCustomerRepository } from '../repositories/DrizzleCustomerRepository';
import { DrizzleCompanyRepository } from '../repositories/DrizzleCompanyRepository';
import { CreateCustomerUseCase } from '../../application/usecases/CreateCustomerUseCase';
import { GetCustomersUseCase } from '../../application/usecases/GetCustomersUseCase';
import { UpdateCustomerUseCase } from '../../application/usecases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../application/usecases/DeleteCustomerUseCase';
import { CreateCompanyUseCase } from '../../application/use-cases/CreateCompanyUseCase';
import { GetCompaniesUseCase } from '../../application/use-cases/GetCompaniesUseCase';
import { UpdateCompanyUseCase } from '../../application/use-cases/UpdateCompanyUseCase';
import { ManageCompanyMembershipUseCase } from '../../application/use-cases/ManageCompanyMembershipUseCase';
import { CustomerApplicationService } from '../../application/services/CustomerApplicationService';
import { CustomerController } from '../../application/controllers/CustomerController';
import { CompanyController } from '../../application/controllers/CompanyController';
import { DomainEventPublisher } from '../../../shared/infrastructure/DomainEventPublisher';

export function setupCustomerDependencies(): void {
  // Register repositories
  container.registerSingleton(TOKENS.CUSTOMER_REPOSITORY, () => new DrizzleCustomerRepository());
  container.registerSingleton(TOKENS.COMPANY_REPOSITORY, () => new DrizzleCompanyRepository());

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

  // Register company use cases
  container.register(TOKENS.CREATE_COMPANY_USE_CASE, () => new CreateCompanyUseCase(
    container.resolve(TOKENS.COMPANY_REPOSITORY)
  ));

  container.register(TOKENS.GET_COMPANIES_USE_CASE, () => new GetCompaniesUseCase(
    container.resolve(TOKENS.COMPANY_REPOSITORY)
  ));

  container.register(TOKENS.UPDATE_COMPANY_USE_CASE, () => new UpdateCompanyUseCase(
    container.resolve(TOKENS.COMPANY_REPOSITORY)
  ));

  container.register(TOKENS.MANAGE_COMPANY_MEMBERSHIP_USE_CASE, () => new ManageCompanyMembershipUseCase(
    container.resolve(TOKENS.COMPANY_REPOSITORY)
  ));

  // Register application service
  container.register(TOKENS.CUSTOMER_APPLICATION_SERVICE, () => new CustomerApplicationService(
    container.resolve(TOKENS.CREATE_CUSTOMER_USE_CASE),
    container.resolve(TOKENS.GET_CUSTOMERS_USE_CASE),
    container.resolve(TOKENS.UPDATE_CUSTOMER_USE_CASE),
    container.resolve(TOKENS.DELETE_CUSTOMER_USE_CASE)
  ));

  // Register company controller
  container.register(TOKENS.COMPANY_CONTROLLER, () => new CompanyController(
    container.resolve(TOKENS.CREATE_COMPANY_USE_CASE),
    container.resolve(TOKENS.GET_COMPANIES_USE_CASE),
    container.resolve(TOKENS.UPDATE_COMPANY_USE_CASE),
    container.resolve(TOKENS.MANAGE_COMPANY_MEMBERSHIP_USE_CASE)
  ));
}

export function getCustomerController(): CustomerController {
  return new CustomerController(
    container.resolve(TOKENS.CUSTOMER_APPLICATION_SERVICE)
  );
}

export function getCompanyController(): CompanyController {
  return container.resolve(TOKENS.COMPANY_CONTROLLER);
}