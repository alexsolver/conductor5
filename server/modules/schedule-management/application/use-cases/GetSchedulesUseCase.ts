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