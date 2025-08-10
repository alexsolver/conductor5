import { ISchedule } from '../../domain/entities/ISchedule';
import { IIScheduleRepository } from '../../domain/ports/IIScheduleRepository';
// Removed drizzle import - Domain layer should not depend on ORM
import * as schema from '@shared/schema';

export interface IScheduleRepository {
  create(schedule: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, schedule: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByUserId(userId: string): Promise<any[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
}