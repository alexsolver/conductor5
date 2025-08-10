
import { Timecard } from '../entities/Timecard';

export interface ITimecardRepository {
  findById(id: string): Promise<Timecard | null>;
  findByTenantId(tenantId: string): Promise<Timecard[]>;
  findByUserId(userId: string): Promise<Timecard[]>;
  create(timecard: Timecard): Promise<Timecard>;
  update(id: string, timecard: Partial<Timecard>): Promise<Timecard | null>;
  delete(id: string): Promise<boolean>;
}
