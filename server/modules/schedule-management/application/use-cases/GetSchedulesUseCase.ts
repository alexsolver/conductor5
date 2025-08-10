
import { Schedule } from '../../domain/entities/Schedule';
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';

export class GetSchedulesUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository
  ) {}

  async execute(tenantId: string, filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Schedule[]> {
    return await this.scheduleRepository.findByTenant(tenantId, filters);
  }
}
