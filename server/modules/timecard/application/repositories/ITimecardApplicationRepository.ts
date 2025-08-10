
import { TimecardDate, WorkingHours } from '../../domain/value-objects';

export interface ITimecardApplicationRepository {
  getCurrentStatus(userId: string, tenantId: string): Promise<{
    status: string;
    entries: any[];
    lastRecord: any;
    totalHours: number;
  }>;

  getTimecardSummary(userId: string, tenantId: string, period: TimecardDate): Promise<{
    totalWorkingDays: number;
    totalHours: number;
    overtimeHours: number;
    averageHoursPerDay: number;
  }>;

  validateTimecardEntry(entry: any): Promise<boolean>;
}
