/**
 * Create Service Use Case
 * Clean Architecture - Application Layer
 */

import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { Service } from '../../domain/entities/Service';
// Inline CreateServiceDTO interface
interface CreateServiceDTO {
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  cost?: number;
  estimatedDuration?: number; // in minutes
  skillsRequired?: string[];
  specifications?: Record<string, any>;
}
import { randomUUID } from 'crypto';

export class CreateServiceUseCase {
  constructor(
    private serviceRepository: IServiceRepository
  ) {}

  async execute(data: CreateServiceDTO): Promise<Service> {
    // Business rule validations
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Service name must be at least 2 characters long');
    }

    if (!data.category) {
      throw new Error('Service category is required');
    }

    if (data.price !== undefined && data.price < 0) {
      throw new Error('Service price cannot be negative');
    }

    // Create service entity
    const service = new Service(
      randomUUID(),
      data.tenantId,
      data.name,
      data.description,
      data.category,
      data.subcategory,
      data.price || 0,
      data.cost || 0,
      data.estimatedDuration,
      data.skillsRequired || [],
      data.specifications || {},
      true, // active
      new Date(),
      new Date()
    );

    // Save to repository
    return await this.serviceRepository.create(service);
  }
}