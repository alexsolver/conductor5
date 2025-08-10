
<line_number>1</line_number>
import { CreateScheduleDTO, UpdateScheduleDTO } from '../dto/CreateScheduleDTO';
import { Schedule } from '../../domain/entities/Schedule';
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

export class ScheduleApplicationService {
  constructor(private scheduleRepository: IScheduleRepository) {}

  async createSchedule(dto: CreateScheduleDTO): Promise<Schedule> {
    const schedule = new Schedule(
      dto.title,
      dto.description,
      dto.startDate,
      dto.endDate,
      dto.tenantId
    );

    if (dto.customerId) {
      schedule.customerId = dto.customerId;
    }

    if (dto.assignedTo) {
      schedule.assignedTo = dto.assignedTo;
    }

    schedule.priority = dto.priority;
    schedule.status = dto.status;

    return await this.scheduleRepository.create(schedule);
  }

  async getSchedules(tenantId: string): Promise<Schedule[]> {
    return await this.scheduleRepository.findAll(tenantId);
  }

  async getScheduleById(id: string, tenantId: string): Promise<Schedule | null> {
    return await this.scheduleRepository.findById(id, tenantId);
  }

  async updateSchedule(id: string, dto: UpdateScheduleDTO, tenantId: string): Promise<Schedule | null> {
    return await this.scheduleRepository.update(id, dto, tenantId);
  }

  async deleteSchedule(id: string, tenantId: string): Promise<boolean> {
    return await this.scheduleRepository.delete(id, tenantId);
  }
}
