import { Schedule } from '../entities/ScheduleEntity';

export interface IScheduleRepository {
  save(schedule: Schedule): Promise<Schedule>;
  findById(id: string): Promise<Schedule | null>;
  findByUserId(userId: string): Promise<Schedule[]>;
  findByCustomerId(customerId: string): Promise<Schedule[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Schedule[]>;
  findByStatus(status: string): Promise<Schedule[]>;
  delete(id: string): Promise<void>;
  update(schedule: Schedule): Promise<Schedule>;
}
export interface IScheduleRepository {
  findById(id: string): Promise<ScheduleEntity | null>;
  findAll(): Promise<ScheduleEntity[]>;
  save(schedule: ScheduleEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
