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
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

export class CreateScheduleUseCase {
  constructor(private scheduleRepository: IScheduleRepository) {}

  async execute(scheduleData: any): Promise<any> {
    // Validate input
    if (!scheduleData.userId || !scheduleData.startTime || !scheduleData.endTime) {
      throw new Error('UserId, startTime, and endTime are required');
    }

    // Domain validation
    const startTime = new Date(scheduleData.startTime);
    const endTime = new Date(scheduleData.endTime);
    
    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }

    // Create schedule
    const schedule = {
      ...scheduleData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.scheduleRepository.create(schedule);
  }
}
