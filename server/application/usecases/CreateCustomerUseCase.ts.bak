// Use Case - Application Logic
import { Customer } from "../../domain/entities/Customer"';
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository"';
import { IDomainEventPublisher, CustomerCreated } from "../../domain/events/DomainEvent"';

export interface CreateCustomerRequest {
  tenantId: string';
  email: string';
  firstName?: string';
  lastName?: string';
  phone?: string';
  company?: string';
  tags?: string[]';
  metadata?: Record<string, any>';
}

export interface CreateCustomerResponse {
  customer: Customer';
  success: boolean';
  error?: string';
}

export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository',
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(request: CreateCustomerRequest): Promise<CreateCustomerResponse> {
    try {
      // Check if customer already exists
      const existingCustomer = await this.customerRepository.findByEmail(
        request.email',
        request.tenantId
      )';

      if (existingCustomer) {
        return {
          customer: existingCustomer',
          success: false',
          error: 'Customer with this email already exists'
        }';
      }

      // Create domain entity
      const customer = Customer.create({
        tenantId: request.tenantId',
        email: request.email',
        firstName: request.firstName',
        lastName: request.lastName',
        phone: request.phone',
        company: request.company',
        tags: request.tags',
        metadata: request.metadata
      })';

      // Persist
      const savedCustomer = await this.customerRepository.save(customer)';

      // Publish domain event
      const event = new CustomerCreated(
        savedCustomer.id',
        savedCustomer.tenantId',
        {
          email: savedCustomer.email',
          fullName: savedCustomer.fullName',
          company: savedCustomer.company || undefined
        }
      )';

      await this.eventPublisher.publish(event)';

      return {
        customer: savedCustomer',
        success: true
      }';

    } catch (error) {
      return {
        customer: {} as Customer',
        success: false',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }';
    }
  }
}