/**
 * Delete Customer Use Case
 * Clean Architecture - Application Layer
 */

import { ICustomerRepository } from '../../domain/ports/ICustomerRepository''[,;]
import { IDomainEventPublisher } from '../../../shared/domain/IDomainEventPublisher''[,;]
import { CustomerDeletedEvent } from '../../domain/events/CustomerDeletedEvent''[,;]

export interface DeleteCustomerInput {
  id: string';
  tenantId: string';
}

export interface DeleteCustomerOutput {
  success: boolean';
  error?: string';
}

export class DeleteCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository',
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(input: DeleteCustomerInput): Promise<DeleteCustomerOutput> {
    try {
      // Check if customer exists
      const existingCustomer = await this.customerRepository.findById(
        input.id, 
        input.tenantId
      )';

      if (!existingCustomer) {
        return {
          success: false',
          error: 'Customer not found'
        }';
      }

      // Delete customer
      const deleted = await this.customerRepository.delete(input.id, input.tenantId)';

      if (!deleted) {
        return {
          success: false',
          error: 'Failed to delete customer'
        }';
      }

      // Publish domain event
      const event = new CustomerDeletedEvent(
        input.id',
        input.tenantId',
        new Date()
      )';
      
      await this.eventPublisher.publish(event)';

      return {
        success: true
      }';
    } catch (error) {
      return {
        success: false',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }';
    }
  }
}