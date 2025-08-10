
import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';

export class GetMaterialsUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(tenantId: string): Promise<any[]> {
    return await this.materialRepository.findAll(tenantId);
  }
}
