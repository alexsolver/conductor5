/**
 * Update Customer Use Case
 * Clean Architecture - Application Layer
 */

import { Customer } from '../../domain/entities/Customer';
import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { IDomainEventPublisher } from '../../../shared/domain/IDomainEventPublisher';
import { CustomerUpdatedEvent } from '../../domain/events/CustomerUpdatedEvent';

export interface UpdateCustomerInput {
  id: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  timezone?: string;
  locale?: string;
  language?: string;
  externalId?: string;
  role?: string;
  notes?: string;
  verified?: boolean;
  active?: boolean;
  suspended?: boolean;
}

export interface UpdateCustomerOutput {
  success: boolean;
  customer?: Customer;
  error?: string;
}

export class UpdateCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(input: UpdateCustomerInput): Promise<UpdateCustomerOutput> {
    try {
      // Find existing customer
      const existingCustomer = await this.customerRepository.findById(
        input.id, 
        input.tenantId
      );

      if (!existingCustomer) {
        return {
          success: false,
          error: 'Customer not found'
        };
      }

      // Check email uniqueness if email is being changed
      if (input.email && input.email !== existingCustomer.getEmail()) {
        const customerWithEmail = await this.customerRepository.findByEmail(
          input.email, 
          input.tenantId
        );

        if (customerWithEmail) {
          return {
            success: false,
            error: 'Customer with this email already exists'
          };
        }
      }

      // Update customer
      const updatedCustomer = existingCustomer.update({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        timezone: input.timezone,
        locale: input.locale,
        language: input.language,
        externalId: input.externalId,
        role: input.role,
        notes: input.notes,
        verified: input.verified,
        active: input.active,
        suspended: input.suspended
      });

      // Save customer
      const savedCustomer = await this.customerRepository.save(updatedCustomer);

      // Publish domain event
      const event = new CustomerUpdatedEvent(
        savedCustomer.getId(),
        savedCustomer.getTenantId(),
        new Date()
      );
      
      await this.eventPublisher.publish(event);

      return {
        success: true,
        customer: savedCustomer
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}