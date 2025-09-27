/**
 * Dependency Injection Container
 * Implements Inversion of Control for Clean Architecture
 */

type Constructor<T = {}> = new (...args: any[]) => T;
type ServiceFactory<T> = () => T;

export interface IDependencyContainer {
  register<T>(token: string | symbol, implementation: Constructor<T> | ServiceFactory<T> | T): void;
  registerSingleton<T>(token: string | symbol, implementation: Constructor<T> | ServiceFactory<T>): void;
  resolve<T>(token: string | symbol): T;
  isRegistered(token: string | symbol): boolean;
}

export class DependencyContainer implements IDependencyContainer {
  private static instance: DependencyContainer;
  private services = new Map<string | symbol, any>();
  private singletons = new Map<string | symbol, any>();
  private factories = new Map<string | symbol, ServiceFactory<any>>();

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  register<T>(token: string | symbol, implementation: Constructor<T> | ServiceFactory<T> | T): void {
    if (typeof implementation === 'function' && implementation.prototype) {
      // Constructor function
      this.services.set(token, implementation);
    } else if (typeof implementation === 'function') {
      // Factory function
      this.factories.set(token, implementation as ServiceFactory<T>);
    } else {
      // Instance
      this.services.set(token, implementation);
    }
  }

  registerSingleton<T>(token: string | symbol, implementation: Constructor<T> | ServiceFactory<T>): void {
    if (typeof implementation === 'function' && implementation.prototype) {
      // Constructor function
      this.services.set(token, implementation);
      this.singletons.set(token, null); // Mark as singleton
    } else if (typeof implementation === 'function') {
      // Factory function
      this.factories.set(token, implementation as ServiceFactory<T>);
      this.singletons.set(token, null); // Mark as singleton
    }
  }

  resolve<T>(token: string | symbol): T {
    // Check if it's a singleton and already instantiated
    if (this.singletons.has(token) && this.singletons.get(token) !== null) {
      return this.singletons.get(token);
    }

    // Try factory first
    if (this.factories.has(token)) {
      const factory = this.factories.get(token);
      const instance = factory();
      
      // If it's a singleton, store the instance
      if (this.singletons.has(token)) {
        this.singletons.set(token, instance);
      }
      
      return instance;
    }

    // Try service registration
    if (this.services.has(token)) {
      const service = this.services.get(token);
      
      // If it's already an instance, return it
      if (typeof service !== 'function') {
        return service;
      }
      
      // If it's a constructor, create new instance
      const instance = new service();
      
      // If it's a singleton, store the instance
      if (this.singletons.has(token)) {
        this.singletons.set(token, instance);
      }
      
      return instance;
    }

    throw new Error(`Service not registered: ${String(token)}`);
  }

  isRegistered(token: string | symbol): boolean {
    return this.services.has(token) || this.factories.has(token);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
  }

  // Method to initialize common services
  async initializeCommonServices(): Promise<void> {
    try {
      // Register CreateTicketUseCase factory
      this.registerSingleton(TOKENS.CREATE_TICKET_USE_CASE, () => {
        // Import and create dependencies
        return this.createTicketUseCaseFactory();
      });
      
      console.log('✅ [DependencyContainer] Common services initialized');
    } catch (error) {
      console.error('❌ [DependencyContainer] Failed to initialize common services:', error);
    }
  }

  private async createTicketUseCaseFactory() {
    try {
      const { CreateTicketUseCase } = await import('../../tickets/application/use-cases/CreateTicketUseCase');
      const { DrizzleTicketRepository } = await import('../../tickets/infrastructure/repositories/DrizzleTicketRepository');
      const { TicketDomainService } = await import('../../tickets/domain/services/TicketDomainService');
      
      const ticketRepository = new DrizzleTicketRepository();
      const ticketDomainService = new TicketDomainService();
      
      return new CreateTicketUseCase(ticketRepository, ticketDomainService);
    } catch (error) {
      console.error('❌ [DependencyContainer] Failed to create CreateTicketUseCase:', error);
      throw error;
    }
  }
}

// Service tokens for type safety
export const TOKENS = {
  // Repositories
  CUSTOMER_REPOSITORY: Symbol('ICustomerRepository'),
  COMPANY_REPOSITORY: Symbol('ICompanyRepository'),
  TICKET_REPOSITORY: Symbol('ITicketRepository'),
  USER_REPOSITORY: Symbol('IUserRepository'),
  PERSON_REPOSITORY: Symbol('IPersonRepository'),
  
  // Use Cases
  CREATE_CUSTOMER_USE_CASE: Symbol('CreateCustomerUseCase'),
  GET_CUSTOMERS_USE_CASE: Symbol('GetCustomersUseCase'),
  UPDATE_CUSTOMER_USE_CASE: Symbol('UpdateCustomerUseCase'),
  DELETE_CUSTOMER_USE_CASE: Symbol('DeleteCustomerUseCase'),
  
  // Company Use Cases
  CREATE_COMPANY_USE_CASE: Symbol('CreateCompanyUseCase'),
  GET_COMPANIES_USE_CASE: Symbol('GetCompaniesUseCase'),
  UPDATE_COMPANY_USE_CASE: Symbol('UpdateCompanyUseCase'),
  MANAGE_COMPANY_MEMBERSHIP_USE_CASE: Symbol('ManageCompanyMembershipUseCase'),
  
  // Ticket Use Cases
  CREATE_TICKET_USE_CASE: Symbol('CreateTicketUseCase'),
  GET_TICKETS_USE_CASE: Symbol('GetTicketsUseCase'),
  ASSIGN_TICKET_USE_CASE: Symbol('AssignTicketUseCase'),
  RESOLVE_TICKET_USE_CASE: Symbol('ResolveTicketUseCase'),
  
  // Application Services
  CUSTOMER_APPLICATION_SERVICE: Symbol('CustomerApplicationService'),
  COMPANY_CONTROLLER: Symbol('CompanyController'),
  TICKET_APPLICATION_SERVICE: Symbol('TicketApplicationService'),
  
  // CQRS
  QUERY_BUS: Symbol('IQueryBus'),
  COMMAND_BUS: Symbol('ICommandBus'),
  
  // Query Handlers
  GET_CUSTOMERS_QUERY_HANDLER: Symbol('GetCustomersQueryHandler'),
  GET_TICKETS_QUERY_HANDLER: Symbol('GetTicketsQueryHandler'),
  
  // Command Handlers
  CREATE_CUSTOMER_COMMAND_HANDLER: Symbol('CreateCustomerCommandHandler'),
  CREATE_TICKET_COMMAND_HANDLER: Symbol('CreateTicketCommandHandler'),
  
  // Domain Services
  DOMAIN_EVENT_PUBLISHER: Symbol('IDomainEventPublisher'),
  VALIDATION_SERVICE: Symbol('IValidationService'),
  ID_GENERATOR: Symbol('IIdGenerator'),
  
  // External Services
  EMAIL_SERVICE: Symbol('IEmailService'),
  FILE_STORAGE_SERVICE: Symbol('IFileStorageService'),
  PASSWORD_SERVICE: Symbol('IPasswordService'),
  
  // Infrastructure
  DATABASE_CONNECTION: Symbol('DatabaseConnection'),
  SCHEMA_MANAGER: Symbol('SchemaManager'),
} as const;

export const container = DependencyContainer.getInstance();