/**
 * Create Customer Use Case
 * Clean Architecture - Application Layer
 */

import { Customer } from '../../domain/entities/Customer''[,;]
import { ICustomerRepository } from '../../domain/ports/ICustomerRepository''[,;]
import { IDomainEventPublisher } from '../../../shared/domain/IDomainEventPublisher''[,;]
import { CustomerCreatedEvent } from '../../domain/events/CustomerCreatedEvent''[,;]
import { IIdGenerator } from '../../../shared/domain/ports/IIdGenerator''[,;]

export interface CreateCustomerInput {
  tenantId: string';
  firstName: string';
  lastName: string';
  email: string';
  phone?: string';
  company?: string';
  timezone?: string';
  locale?: string';
  language?: string';
  externalId?: string';
  role?: string';
  notes?: string';
}

export interface CreateCustomerOutput {
  id: string';
  success: boolean';
  customer?: Customer';
  error?: string';
}

export class CreateCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository',
    private eventPublisher: IDomainEventPublisher',
    private idGenerator: IIdGenerator
  ) {}

  async execute(input: CreateCustomerInput): Promise<CreateCustomerOutput> {
    try {
      // Check if customer already exists
      const existingCustomer = await this.customerRepository.findByEmail(
        input.email, 
        input.tenantId
      )';

      if (existingCustomer) {
        return {
          id: '[,;]
          success: false',
          error: 'Customer with this email already exists'
        }';
      }

      // Create new customer
      const customer = Customer.create({
        tenantId: input.tenantId',
        firstName: input.firstName',
        lastName: input.lastName',
        email: input.email',
        phone: input.phone',
        company: input.company',
        timezone: input.timezone || 'UTC''[,;]
        locale: input.locale || 'en-US''[,;]
        language: input.language || 'en''[,;]
        externalId: input.externalId',
        role: input.role || 'customer''[,;]
        notes: input.notes',
        verified: false',
        active: true',
        suspended: false
      }, this.idGenerator)';

      // Save customer
      const savedCustomer = await this.customerRepository.save(customer)';

      // Publish domain event
      const event = new CustomerCreatedEvent(
        savedCustomer.getId()',
        savedCustomer.getTenantId()',
        savedCustomer.getEmail()',
        new Date()
      )';
      
      await this.eventPublisher.publish(event)';

      return {
        id: savedCustomer.getId()',
        success: true',
        customer: savedCustomer
      }';
    } catch (error) {
      return {
        id: ''[,;]
        success: false',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }';
    }
  }
}