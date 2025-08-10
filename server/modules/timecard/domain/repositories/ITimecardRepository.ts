
import { Timecard } from '../entities/Timecard';

export interface ITimecardRepository {
  findById(id: string): Promise<Timecard | null>;
  findByTenantId(tenantId: string): Promise<Timecard[]>;
  findByUserId(userId: string): Promise<Timecard[]>;
  create(timecard: Timecard): Promise<Timecard>;
  update(id: string, timecard: Partial<Timecard>): Promise<Timecard | null>;
  delete(id: string): Promise<boolean>;
}
import { Timecard } from '../entities/Timecard';

export interface ITimecardRepository {
  findById(id: string, tenantId: string): Promise<Timecard | null>;
  findAll(tenantId: string): Promise<Timecard[]>;
  create(timecard: Timecard): Promise<Timecard>;
  update(id: string, timecard: Partial<Timecard>, tenantId: string): Promise<Timecard | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  findByUserId(userId: string, tenantId: string): Promise<Timecard[]>;
  findByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<Timecard[]>;
}
export interface ITimecardRepository {
  findById(id: string): Promise<Timecard | null>;
  findAll(): Promise<Timecard[]>;
  save(timecard: Timecard): Promise<void>;
  delete(id: string): Promise<void>;
}
