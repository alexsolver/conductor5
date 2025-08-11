/**
 * Create Material Use Case
 * Clean Architecture - Application Layer
 * Pure business logic without external dependencies
 */

import { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material } from '../../domain/entities/Material';
import { CreateMaterialDTO } from '../dto/CreateMaterialDTO';
import { randomUUID } from 'crypto';

export class CreateMaterialUseCase {
  constructor(
    private materialRepository: IMaterialRepository
  ) {}

  async execute(data: CreateMaterialDTO): Promise<Material> {
    // Business rule validations
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Material name must be at least 2 characters long');
    }

    if (!data.category) {
      throw new Error('Material category is required');
    }

    if (data.price !== undefined && data.price < 0) {
      throw new Error('Material price cannot be negative');
    }

    // Create material entity
    const material = new Material(
      randomUUID(),
      data.tenantId,
      data.name,
      data.description,
      data.category,
      data.subcategory,
      data.unit || 'unit',
      data.price || 0,
      data.cost || 0,
      data.supplier,
      data.sku,
      data.stockQuantity || 0,
      data.minStock || 0,
      data.maxStock,
      data.specifications || {},
      true, // active
      new Date(),
      new Date()
    );

    // Save to repository
    return await this.materialRepository.create(material);
  }
}