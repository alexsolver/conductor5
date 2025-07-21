// Application Layer - Use Case
import { Customer } from "../../domain/entities/Customer";
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository";
import { CustomerCreated } from "../../domain/events/CustomerEvents";
import { IDomainEventPublisher } from "../../../shared/events/IDomainEventPublisher";

export interface CreateCustomerRequest {
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  verified?: boolean;
  timezone?: string;
  locale?: string;
  language?: string;
  role?: string;
}

export class CreateCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(request: CreateCustomerRequest): Promise<Customer> {
    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findByEmail(
      request.email,
      request.tenantId
    );

    if (existingCustomer) {
      throw new Error('Customer with this email already exists');
    }

    // Create customer entity
    const customer = Customer.create({
      tenantId: request.tenantId,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
      company: request.company,
      tags: request.tags,
      metadata: request.metadata,
      verified: request.verified,
      timezone: request.timezone,
      locale: request.locale,
      language: request.language,
      role: request.role,
    });

    // Save to repository
    const savedCustomer = await this.customerRepository.save(customer);

    // Publish domain event
    const event = new CustomerCreated(
      savedCustomer.id,
      savedCustomer.tenantId,
      {
        email: savedCustomer.email,
        fullName: savedCustomer.fullName,
        company: savedCustomer.company || undefined,
      }
    );

    await this.eventPublisher.publish(event);

    return savedCustomer;
  }
}