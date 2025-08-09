
import { TimecardEntry } from '../entities';

export interface ITimecardRepository {
  findById(id: string): Promise<TimecardEntry | null>;
  findByUser(userId: string): Promise<TimecardEntry[]>;
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TimecardEntry[]>;
  create(entry: Omit<TimecardEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimecardEntry>;
  update(id: string, entry: Partial<TimecardEntry>): Promise<TimecardEntry>;
  delete(id: string): Promise<void>;
}
