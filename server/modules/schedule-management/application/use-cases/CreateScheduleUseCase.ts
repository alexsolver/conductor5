import { Schedule } from '../../domain/entities/Schedule';
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';

// Use case should depend on domain interfaces only

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
  }): Promise<Schedule> {
    const schedule = Schedule.create(
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