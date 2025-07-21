/**
 * Infrastructure Dependency Setup
 * Clean Architecture - Infrastructure Layer
 * Configures all infrastructure dependencies and abstractions
 */

import { container, TOKENS } from '../DependencyContainer';

// Domain Event Publisher
import { DomainEventPublisher } from '../events/DomainEventPublisher';

// ID Generator
import { UuidGenerator } from '../services/UuidGenerator';

// Email Service
import { ConsoleEmailService } from '../services/EmailService';

// Password Service
import { BcryptPasswordService } from '../../auth/infrastructure/services/BcryptPasswordService';

// Repositories
import { DrizzleCustomerRepository } from '../../customers/infrastructure/repositories/DrizzleCustomerRepository';
import { DrizzleTicketRepository } from '../../tickets/infrastructure/repositories/DrizzleTicketRepository';
import { DrizzleUserRepository } from '../../auth/infrastructure/repositories/DrizzleUserRepository';

// CQRS Infrastructure
import { InMemoryCommandBus } from '../cqrs/InMemoryCommandBus';
import { InMemoryQueryBus } from '../cqrs/InMemoryQueryBus';

// Use Cases
import { CreateCustomerUseCase } from '../../customers/application/usecases/CreateCustomerUseCase';
import { GetCustomersUseCase } from '../../customers/application/usecases/GetCustomersUseCase';
import { UpdateCustomerUseCase } from '../../customers/application/usecases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../customers/application/usecases/DeleteCustomerUseCase';

import { CreateTicketUseCase } from '../../tickets/application/usecases/CreateTicketUseCase';
import { GetTicketsUseCase } from '../../tickets/application/usecases/GetTicketsUseCase';
import { AssignTicketUseCase } from '../../tickets/application/usecases/AssignTicketUseCase';
import { ResolveTicketUseCase } from '../../tickets/application/usecases/ResolveTicketUseCase';

import { CreateUserUseCase } from '../../auth/application/usecases/CreateUserUseCase';

// Application Services
import { CustomerApplicationService } from '../../customers/application/services/CustomerApplicationService';
import { TicketApplicationService } from '../../tickets/application/services/TicketApplicationService';

// Command/Query Handlers
import { CreateCustomerCommandHandler } from '../../customers/application/commands/CreateCustomerCommand';
import { GetCustomersQueryHandler } from '../../customers/application/queries/GetCustomersQuery';
import { CreateTicketCommandHandler } from '../../tickets/application/commands/CreateTicketCommand';
import { GetTicketsQueryHandler } from '../../tickets/application/queries/GetTicketsQuery';

/**
 * Setup all infrastructure dependencies with proper Clean Architecture abstractions
 */
export function setupInfrastructureDependencies(): void {
  // Core Infrastructure Services
  container.registerSingleton(TOKENS.DOMAIN_EVENT_PUBLISHER, () => new DomainEventPublisher());
  container.registerSingleton(TOKENS.ID_GENERATOR, () => new UuidGenerator());
  container.registerSingleton(TOKENS.EMAIL_SERVICE, () => new ConsoleEmailService());
  
  // Auth Infrastructure
  container.registerSingleton(TOKENS.PASSWORD_SERVICE, () => new BcryptPasswordService());
  
  // Repository Implementations
  container.registerSingleton(TOKENS.CUSTOMER_REPOSITORY, () => new DrizzleCustomerRepository());
  container.registerSingleton(TOKENS.TICKET_REPOSITORY, () => new DrizzleTicketRepository());
  container.registerSingleton(TOKENS.USER_REPOSITORY, () => new DrizzleUserRepository());
  
  // CQRS Infrastructure
  container.registerSingleton(TOKENS.COMMAND_BUS, () => new InMemoryCommandBus());
  container.registerSingleton(TOKENS.QUERY_BUS, () => new InMemoryQueryBus());
  
  // Use Cases
  container.registerSingleton(TOKENS.CREATE_CUSTOMER_USE_CASE, () => new CreateCustomerUseCase(
    container.resolve(TOKENS.CUSTOMER_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER),
    container.resolve(TOKENS.ID_GENERATOR)
  ));
  
  container.registerSingleton(TOKENS.GET_CUSTOMERS_USE_CASE, () => new GetCustomersUseCase(
    container.resolve(TOKENS.CUSTOMER_REPOSITORY)
  ));
  
  container.registerSingleton(TOKENS.UPDATE_CUSTOMER_USE_CASE, () => new UpdateCustomerUseCase(
    container.resolve(TOKENS.CUSTOMER_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER)
  ));
  
  container.registerSingleton(TOKENS.DELETE_CUSTOMER_USE_CASE, () => new DeleteCustomerUseCase(
    container.resolve(TOKENS.CUSTOMER_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER)
  ));
  
  container.registerSingleton(TOKENS.CREATE_TICKET_USE_CASE, () => new CreateTicketUseCase(
    container.resolve(TOKENS.TICKET_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER),
    container.resolve(TOKENS.ID_GENERATOR)
  ));
  
  container.registerSingleton(TOKENS.GET_TICKETS_USE_CASE, () => new GetTicketsUseCase(
    container.resolve(TOKENS.TICKET_REPOSITORY)
  ));
  
  container.registerSingleton(TOKENS.ASSIGN_TICKET_USE_CASE, () => new AssignTicketUseCase(
    container.resolve(TOKENS.TICKET_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER)
  ));
  
  container.registerSingleton(TOKENS.RESOLVE_TICKET_USE_CASE, () => new ResolveTicketUseCase(
    container.resolve(TOKENS.TICKET_REPOSITORY),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER)
  ));
  
  container.registerSingleton(TOKENS.CREATE_USER_USE_CASE, () => new CreateUserUseCase(
    container.resolve(TOKENS.USER_REPOSITORY),
    container.resolve(TOKENS.PASSWORD_SERVICE),
    container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER),
    container.resolve(TOKENS.ID_GENERATOR)
  ));
  
  // Application Services
  container.registerSingleton(TOKENS.CUSTOMER_APPLICATION_SERVICE, () => new CustomerApplicationService(
    container.resolve(TOKENS.CREATE_CUSTOMER_USE_CASE),
    container.resolve(TOKENS.GET_CUSTOMERS_USE_CASE),
    container.resolve(TOKENS.UPDATE_CUSTOMER_USE_CASE),
    container.resolve(TOKENS.DELETE_CUSTOMER_USE_CASE)
  ));
  
  container.registerSingleton(TOKENS.TICKET_APPLICATION_SERVICE, () => new TicketApplicationService(
    container.resolve(TOKENS.CREATE_TICKET_USE_CASE),
    container.resolve(TOKENS.GET_TICKETS_USE_CASE),
    container.resolve(TOKENS.ASSIGN_TICKET_USE_CASE),
    container.resolve(TOKENS.RESOLVE_TICKET_USE_CASE)
  ));
  
  // Command Handlers
  container.registerSingleton(TOKENS.CREATE_CUSTOMER_COMMAND_HANDLER, () => new CreateCustomerCommandHandler(
    container.resolve(TOKENS.CREATE_CUSTOMER_USE_CASE)
  ));
  
  container.registerSingleton(TOKENS.CREATE_TICKET_COMMAND_HANDLER, () => new CreateTicketCommandHandler(
    container.resolve(TOKENS.CREATE_TICKET_USE_CASE)
  ));
  
  // Query Handlers
  container.registerSingleton(TOKENS.GET_CUSTOMERS_QUERY_HANDLER, () => new GetCustomersQueryHandler(
    container.resolve(TOKENS.GET_CUSTOMERS_USE_CASE)
  ));
  
  container.registerSingleton(TOKENS.GET_TICKETS_QUERY_HANDLER, () => new GetTicketsQueryHandler(
    container.resolve(TOKENS.GET_TICKETS_USE_CASE)
  ));
  
  // Register CQRS Handlers
  const commandBus = container.resolve(TOKENS.COMMAND_BUS);
  const queryBus = container.resolve(TOKENS.QUERY_BUS);
  
  commandBus.register('CreateCustomerCommand', container.resolve(TOKENS.CREATE_CUSTOMER_COMMAND_HANDLER));
  commandBus.register('CreateTicketCommand', container.resolve(TOKENS.CREATE_TICKET_COMMAND_HANDLER));
  
  queryBus.register('GetCustomersQuery', container.resolve(TOKENS.GET_CUSTOMERS_QUERY_HANDLER));
  queryBus.register('GetTicketsQuery', container.resolve(TOKENS.GET_TICKETS_QUERY_HANDLER));
}

/**
 * Get configured infrastructure services
 */
export function getInfrastructureServices() {
  return {
    customerApplicationService: container.resolve(TOKENS.CUSTOMER_APPLICATION_SERVICE),
    ticketApplicationService: container.resolve(TOKENS.TICKET_APPLICATION_SERVICE),
    commandBus: container.resolve(TOKENS.COMMAND_BUS),
    queryBus: container.resolve(TOKENS.QUERY_BUS),
    domainEventPublisher: container.resolve(TOKENS.DOMAIN_EVENT_PUBLISHER),
    emailService: container.resolve(TOKENS.EMAIL_SERVICE)
  };
}