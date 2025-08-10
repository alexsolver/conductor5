import { ScheduleEntity } from '../../domain/entities/ScheduleEntity';
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

export class CreateScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository
  ) {}

  async execute(data: {
    tenantId: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    title: string;
    description?: string;
  }): Promise<ScheduleEntity> {
    const schedule = ScheduleEntity.create(
      crypto.randomUUID(),
      data.tenantId,
      data.userId,
      data.startTime,
      data.endTime,
      data.title,
      data.description
    );

    if (!schedule.isValid()) {
      throw new Error('Invalid schedule data');
    }

    return await this.scheduleRepository.create(schedule);
  }
}