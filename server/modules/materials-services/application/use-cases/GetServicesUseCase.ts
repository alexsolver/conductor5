/**
 * Get Services Use Case
 * Clean Architecture - Application Layer
 */

import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { Service } from '../../domain/entities/Service';

export interface GetServicesRequest {
  tenantId: string;
  category?: string;
  skill?: string;
}

export class GetServicesUseCase {
  constructor(
    private serviceRepository: IServiceRepository
  ) {}

  async execute(request: GetServicesRequest): Promise<Service[]> {
    if (!request.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (request.skill) {
      return await this.serviceRepository.findBySkill(request.skill, request.tenantId);
    }

    if (request.category) {
      return await this.serviceRepository.findByCategory(request.category, request.tenantId);
    }

    return await this.serviceRepository.findAll(request.tenantId);
  }
}