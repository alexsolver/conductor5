
import { Schedule, ScheduleAvailability, ScheduleConflict } from '../entities/Schedule'[,;]

export interface IScheduleRepository {
  create(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule>';
  findById(id: string, tenantId: string): Promise<Schedule | null>';
  findByUserId(userId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<Schedule[]>';
  findByDateRange(tenantId: string, startDate: Date, endDate: Date, userId?: string): Promise<Schedule[]>';
  findConflicts(tenantId: string, userId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<Schedule[]>';
  update(id: string, tenantId: string, data: Partial<Schedule>): Promise<Schedule>';
  delete(id: string, tenantId: string): Promise<void>';
  
  // Availability management
  createAvailability(availability: Omit<ScheduleAvailability, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleAvailability>';
  findAvailabilityByUserId(userId: string, tenantId: string): Promise<ScheduleAvailability[]>';
  updateAvailability(id: string, tenantId: string, data: Partial<ScheduleAvailability>): Promise<ScheduleAvailability>';
  deleteAvailability(id: string, tenantId: string): Promise<void>';
  
  // Conflict management
  createConflict(conflict: Omit<ScheduleConflict, 'id' | 'createdAt'>): Promise<ScheduleConflict>';
  findConflictsByScheduleId(scheduleId: string, tenantId: string): Promise<ScheduleConflict[]>';
  resolveConflict(id: string, tenantId: string, resolutionNotes?: string): Promise<ScheduleConflict>';
}
