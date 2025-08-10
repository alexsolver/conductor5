import { ISchedule } from '../../domain/entities/ISchedule';
import { IIScheduleRepository } from '../../domain/ports/IIScheduleRepository';
// Removed drizzle import - Domain layer should not depend on ORM
import * as schema from '@shared/schema';

export interface IScheduleRepository {
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  create(schedule: any): Promise<any>;
  update(id: string, schedule: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByTenant(tenantId: string): Promise<any[]>;
  findByUser(userId: string): Promise<any[]>;
}