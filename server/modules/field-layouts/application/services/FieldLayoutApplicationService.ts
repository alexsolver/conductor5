
import { CreateFieldLayoutDTO, UpdateFieldLayoutDTO } from '../dto';
import { FieldLayoutDomainService } from '../../domain/services/FieldLayoutDomainService';
import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';

export class FieldLayoutApplicationService {
  constructor(
    private fieldLayoutRepository: IFieldLayoutRepository,
    private domainService: FieldLayoutDomainService
  ) {}

  async createFieldLayout(dto: CreateFieldLayoutDTO) {
    if (!this.domainService.validateFieldLayout(dto.config)) {
      throw new Error('Invalid field layout configuration');
    }

    const fieldLayout = {
      id: crypto.randomUUID(),
      name: dto.name,
      config: dto.config,
      tenantId: dto.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.fieldLayoutRepository.create(fieldLayout);
  }

  async updateFieldLayout(dto: UpdateFieldLayoutDTO) {
    if (dto.config && !this.domainService.validateFieldLayout(dto.config)) {
      throw new Error('Invalid field layout configuration');
    }

    return await this.fieldLayoutRepository.update(dto.id, {
      name: dto.name,
      config: dto.config,
      updatedAt: new Date()
    });
  }
}
