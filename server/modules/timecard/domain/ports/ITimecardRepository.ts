
/**
 * ITimecardRepository - Clean Architecture Domain Layer Port
 * Follows AGENT_CODING_STANDARDS.md interface patterns
 */

import { Timecard } from '../entities/Timecard';

export interface ITimecardRepository {
  // Basic CRUD operations
  save(timecard: Timecard): Promise<Timecard>;
  findById(id: string): Promise<Timecard | null>;
  update(timecard: Timecard): Promise<Timecard>;
  delete(id: string): Promise<void>;

  // Business queries
  findByUserAndDate(userId: string, tenantId: string, date: Date): Promise<Timecard | null>;
  
  findByUserAndDateRange(
    userId: string, 
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Timecard[]>;

  findByTenantAndDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Timecard[]>;

  findOpenTimecardsByUser(userId: string, tenantId: string): Promise<Timecard[]>;

  findPendingApprovalsByTenant(tenantId: string): Promise<Timecard[]>;

  // Statistics queries
  getTotalHoursByUserAndPeriod(
    userId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number>;

  getTimecardStatsByUser(
    userId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    totalDays: number;
    averageHoursPerDay: number;
  }>;

  // Bulk operations
  bulkSave(timecards: Timecard[]): Promise<Timecard[]>;
  bulkUpdateStatus(
    ids: string[], 
    status: 'open' | 'submitted' | 'approved' | 'rejected',
    approvedById?: string
  ): Promise<void>;
}
