import { ISchedule } from '../../domain/entities/ISchedule';
import { IIScheduleRepository } from '../../domain/ports/IIScheduleRepository';
// Removed drizzle import - Domain layer should not depend on ORM
import * as schema from '@shared/schema';

export class DrizzleIScheduleRepository implements IIScheduleRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<ISchedule | null> {
    // Implementar busca por ID
    throw new Error('Method not implemented.');
  }

  async findAll(tenantId: string): Promise<ISchedule[]> {
    // Implementar busca de todos
    throw new Error('Method not implemented.');
  }

  async create(entity: ISchedule): Promise<ISchedule> {
    // Implementar criação
    throw new Error('Method not implemented.');
  }

  async update(id: string, entity: Partial<ISchedule>, tenantId: string): Promise<ISchedule | null> {
    // Implementar atualização
    throw new Error('Method not implemented.');
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão
    throw new Error('Method not implemented.');
  }
}
import { Schedule } from '../entities/Schedule';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<Schedule | null>;
  findAll(tenantId: string): Promise<Schedule[]>;
  findByTechnicianId(technicianId: string, tenantId: string): Promise<Schedule[]>;
  create(schedule: Schedule): Promise<Schedule>;
  update(id: string, schedule: Partial<Schedule>, tenantId: string): Promise<Schedule | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { ScheduleEntity } from '../entities/ScheduleEntity';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<ScheduleEntity | null>;
  findAll(tenantId: string): Promise<ScheduleEntity[]>;
  create(schedule: ScheduleEntity): Promise<ScheduleEntity>;
  update(id: string, schedule: Partial<ScheduleEntity>, tenantId: string): Promise<ScheduleEntity | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByUserId(userId: string, tenantId: string): Promise<ScheduleEntity[]>;
}
import { Schedule } from '../entities/Schedule';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<Schedule | null>;
  findAll(tenantId: string): Promise<Schedule[]>;
  create(schedule: Schedule): Promise<Schedule>;
  update(id: string, schedule: Partial<Schedule>, tenantId: string): Promise<Schedule | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByUser(userId: string, tenantId: string): Promise<Schedule[]>;
}
import { Schedule } from '../entities/ScheduleEntity';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<Schedule | null>;
  findAll(tenantId: string): Promise<Schedule[]>;
  create(schedule: Schedule): Promise<Schedule>;
  update(id: string, schedule: Partial<Schedule>, tenantId: string): Promise<Schedule | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<Schedule[]>;
  findByUser(userId: string, tenantId: string): Promise<Schedule[]>;
}
import { Schedule } from '../entities/Schedule';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<Schedule | null>;
  findAll(tenantId: string): Promise<Schedule[]>;
  findByUserId(userId: string, tenantId: string): Promise<Schedule[]>;
  create(schedule: Schedule): Promise<Schedule>;
  update(id: string, schedule: Partial<Schedule>, tenantId: string): Promise<Schedule | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
import { Schedule } from '../entities/ScheduleEntity';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<Schedule | null>;
  findAll(tenantId: string): Promise<Schedule[]>;
  create(schedule: Schedule): Promise<Schedule>;
  update(id: string, schedule: Partial<Schedule>, tenantId: string): Promise<Schedule | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<Schedule[]>;
  findByUser(userId: string, tenantId: string): Promise<Schedule[]>;
}
import { ScheduleEntity } from '../entities/ScheduleEntity';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<ScheduleEntity | null>;
  findAll(tenantId: string, filters?: any): Promise<ScheduleEntity[]>;
  create(schedule: ScheduleEntity): Promise<ScheduleEntity>;
  update(id: string, schedule: Partial<ScheduleEntity>, tenantId: string): Promise<ScheduleEntity | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<ScheduleEntity[]>;
  findByUser(userId: string, tenantId: string): Promise<ScheduleEntity[]>;
}
export interface IScheduleRepository {
  create(schedule: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByTenantId(tenantId: string): Promise<any[]>;
  findByUserId(userId: string): Promise<any[]>;
}
import { ScheduleEntity } from '../entities/ScheduleEntity';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<ScheduleEntity | null>;
  findAll(tenantId: string): Promise<ScheduleEntity[]>;
  create(schedule: ScheduleEntity): Promise<ScheduleEntity>;
  update(id: string, schedule: Partial<ScheduleEntity>, tenantId: string): Promise<ScheduleEntity | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<ScheduleEntity[]>;
  findByTechnician(technicianId: string, tenantId: string): Promise<ScheduleEntity[]>;
}
export interface IScheduleRepository {
  create(schedule: any): Promise<any>;
  findById(id: string, tenantId: string): Promise<any | null>;
  findByTenant(tenantId: string): Promise<any[]>;
  update(id: string, tenantId: string, data: any): Promise<any | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
export interface IScheduleRepository {
  findById(id: string): Promise<ScheduleEntity | null>;
  findAll(): Promise<ScheduleEntity[]>;
  save(schedule: ScheduleEntity): Promise<ScheduleEntity>;
  update(id: string, schedule: Partial<ScheduleEntity>): Promise<ScheduleEntity>;
  delete(id: string): Promise<void>;
}
export interface IScheduleRepository {
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
  create(schedule: any): Promise<any>;
  update(id: string, schedule: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  findByTenantId(tenantId: string): Promise<any[]>;
}
import { ScheduleEntity } from '../entities/ScheduleEntity';

export interface IScheduleRepository {
  findById(id: string, tenantId: string): Promise<ScheduleEntity | null>;
  findAll(tenantId: string): Promise<ScheduleEntity[]>;
  create(schedule: ScheduleEntity): Promise<ScheduleEntity>;
  update(id: string, schedule: Partial<ScheduleEntity>, tenantId: string): Promise<ScheduleEntity | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByUserId(userId: string, tenantId: string): Promise<ScheduleEntity[]>;
}
export interface IScheduleRepository {
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  create(schedule: any): Promise<any>;
  update(id: string, schedule: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByUserId(userId: string): Promise<any[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
}
