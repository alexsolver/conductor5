// Dependency Injection Container
import { CustomerRepository } from "../../infrastructure/repositories/CustomerRepository";
import { DomainEventPublisher } from "../../infrastructure/events/DomainEventPublisher";
import { CreateCustomerUseCase } from "../usecases/CreateCustomerUseCase";
import { GetCustomersUseCase } from "../usecases/GetCustomersUseCase";
import { CreateTicketUseCase } from "../usecases/CreateTicketUseCase";
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository";
import { ITicketRepository } from "../../domain/repositories/ITicketRepository";
import { IDomainEventPublisher } from "../../domain/events/DomainEvent";

export class DependencyContainer {
  private static instance: DependencyContainer;
  
  // Repositories
  private _customerRepository: ICustomerRepository;
  private _eventPublisher: IDomainEventPublisher;
  
  // Use Cases
  private _createCustomerUseCase: CreateCustomerUseCase;
  private _getCustomersUseCase: GetCustomersUseCase;
  private _createTicketUseCase: CreateTicketUseCase;

  private constructor() {
    // Initialize repositories
    this._customerRepository = new CustomerRepository();
    this._eventPublisher = new DomainEventPublisher();
    
    // Initialize use cases with dependencies
    this._createCustomerUseCase = new CreateCustomerUseCase(
      this._customerRepository,
      this._eventPublisher
    );
    
    this._getCustomersUseCase = new GetCustomersUseCase(
      this._customerRepository
    );
    
    this._createTicketUseCase = new CreateTicketUseCase(
      null as any, // TODO: Implement TicketRepository
      this._customerRepository,
      this._eventPublisher
    );
  }

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  // Repository getters
  get customerRepository(): ICustomerRepository {
    return this._customerRepository;
  }

  get eventPublisher(): IDomainEventPublisher {
    return this._eventPublisher;
  }

  // Use case getters
  get createCustomerUseCase(): CreateCustomerUseCase {
    return this._createCustomerUseCase;
  }

  get getCustomersUseCase(): GetCustomersUseCase {
    return this._getCustomersUseCase;
  }

  get createTicketUseCase(): CreateTicketUseCase {
    return this._createTicketUseCase;
  }
}