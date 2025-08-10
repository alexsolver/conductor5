// Use repository interface instead of direct database access

import { ScheduleEntity } from '../../domain/entities/ScheduleEntity';
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

export class GetSchedulesUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository
  ) {}

  async execute(tenantId: string, filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ScheduleEntity[]> {
    return await this.scheduleRepository.findByTenant(tenantId, filters);
  }
}
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

export class GetSchedulesUseCase {
  constructor(private scheduleRepository: IScheduleRepository) {}

  async execute(filters: { userId?: string; tenantId?: string; startDate?: Date; endDate?: Date }): Promise<any[]> {
    if (filters.userId) {
      return await this.scheduleRepository.findByUserId(filters.userId);
    }

    if (filters.tenantId) {
      return await this.scheduleRepository.findByTenantId(filters.tenantId);
    }

    return await this.scheduleRepository.findAll();
  }
}
