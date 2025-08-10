
import { Schedule } from '../entities/Schedule';

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
