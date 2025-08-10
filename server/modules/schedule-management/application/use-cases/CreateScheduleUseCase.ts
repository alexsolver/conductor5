import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

interface CreateScheduleRequest {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  assignedTo: string;
  tenantId: string;
}

export class CreateScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository
  ) {}

  async execute(request: CreateScheduleRequest): Promise<any> {
    const schedule = {
      id: crypto.randomUUID(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.scheduleRepository.create(schedule);
  }
}