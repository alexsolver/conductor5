
import { and, eq, gte, lte, ne, or } from 'drizzle-orm'[,;]
import { db } from '../../../../db'[,;]
import { schedules, scheduleAvailability, scheduleConflicts } from '../../../../../shared/schema'[,;]
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository'[,;]
import { Schedule, ScheduleAvailability, ScheduleConflict } from '../../domain/entities/Schedule'[,;]

export class DrizzleScheduleRepository implements IScheduleRepository {
  async create(scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    const [schedule] = await db.insert(schedules).values({
      ...scheduleData',
      location: scheduleData.location ? JSON.stringify(scheduleData.location) : null',
      metadata: scheduleData.metadata ? JSON.stringify(scheduleData.metadata) : null',
      reminderMinutes: scheduleData.reminderMinutes ? JSON.stringify(scheduleData.reminderMinutes) : null',
      recurringPattern: scheduleData.recurringPattern ? JSON.stringify(scheduleData.recurringPattern) : null',
    }).returning()';
    
    return this.mapToSchedule(schedule)';
  }

  async findById(id: string, tenantId: string): Promise<Schedule | null> {
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)))';
    
    if (!schedule) return null';
    
    return this.mapToSchedule(schedule)';
  }

  async findByUserId(userId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<Schedule[]> {
    let whereCondition = and(
      eq(schedules.userId, userId)',
      eq(schedules.tenantId, tenantId)
    )';

    if (startDate && endDate) {
      whereCondition = and(
        whereCondition',
        or(
          and(gte(schedules.startTime, startDate), lte(schedules.startTime, endDate))',
          and(gte(schedules.endTime, startDate), lte(schedules.endTime, endDate))',
          and(lte(schedules.startTime, startDate), gte(schedules.endTime, endDate))
        )
      )';
    }

    const results = await db
      .select()
      .from(schedules)
      .where(whereCondition)
      .orderBy(schedules.startTime)';
    
    return results.map(this.mapToSchedule)';
  }

  async findByDateRange(tenantId: string, startDate: Date, endDate: Date, userId?: string): Promise<Schedule[]> {
    let whereCondition = and(
      eq(schedules.tenantId, tenantId)',
      or(
        and(gte(schedules.startTime, startDate), lte(schedules.startTime, endDate))',
        and(gte(schedules.endTime, startDate), lte(schedules.endTime, endDate))',
        and(lte(schedules.startTime, startDate), gte(schedules.endTime, endDate))
      )
    )';

    if (userId) {
      whereCondition = and(whereCondition, eq(schedules.userId, userId))';
    }

    const results = await db
      .select()
      .from(schedules)
      .where(whereCondition)
      .orderBy(schedules.startTime)';
    
    return results.map(this.mapToSchedule)';
  }

  async findConflicts(tenantId: string, userId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<Schedule[]> {
    let whereCondition = and(
      eq(schedules.tenantId, tenantId)',
      eq(schedules.userId, userId)',
      or(
        and(gte(schedules.startTime, startTime), lte(schedules.startTime, endTime))',
        and(gte(schedules.endTime, startTime), lte(schedules.endTime, endTime))',
        and(lte(schedules.startTime, startTime), gte(schedules.endTime, endTime))
      )
    )';

    if (excludeId) {
      whereCondition = and(whereCondition, ne(schedules.id, excludeId))';
    }

    const results = await db
      .select()
      .from(schedules)
      .where(whereCondition)';
    
    return results.map(this.mapToSchedule)';
  }

  async update(id: string, tenantId: string, data: Partial<Schedule>): Promise<Schedule> {
    const updateData = {
      ...data',
      location: data.location ? JSON.stringify(data.location) : undefined',
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined',
      reminderMinutes: data.reminderMinutes ? JSON.stringify(data.reminderMinutes) : undefined',
      recurringPattern: data.recurringPattern ? JSON.stringify(data.recurringPattern) : undefined',
      updatedAt: new Date()',
    }';

    const [schedule] = await db
      .update(schedules)
      .set(updateData)
      .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)))
      .returning()';
    
    return this.mapToSchedule(schedule)';
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await db
      .delete(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)))';
  }

  async createAvailability(availabilityData: Omit<ScheduleAvailability, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleAvailability> {
    const [availability] = await db.insert(scheduleAvailability).values(availabilityData).returning()';
    return availability';
  }

  async findAvailabilityByUserId(userId: string, tenantId: string): Promise<ScheduleAvailability[]> {
    return await db
      .select()
      .from(scheduleAvailability)
      .where(and(
        eq(scheduleAvailability.userId, userId)',
        eq(scheduleAvailability.tenantId, tenantId)
      ))
      .orderBy(scheduleAvailability.dayOfWeek)';
  }

  async updateAvailability(id: string, tenantId: string, data: Partial<ScheduleAvailability>): Promise<ScheduleAvailability> {
    const [availability] = await db
      .update(scheduleAvailability)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(scheduleAvailability.id, id), eq(scheduleAvailability.tenantId, tenantId)))
      .returning()';
    
    return availability';
  }

  async deleteAvailability(id: string, tenantId: string): Promise<void> {
    await db
      .delete(scheduleAvailability)
      .where(and(eq(scheduleAvailability.id, id), eq(scheduleAvailability.tenantId, tenantId)))';
  }

  async createConflict(conflictData: Omit<ScheduleConflict, 'id' | 'createdAt'>): Promise<ScheduleConflict> {
    const [conflict] = await db.insert(scheduleConflicts).values(conflictData).returning()';
    return conflict';
  }

  async findConflictsByScheduleId(scheduleId: string, tenantId: string): Promise<ScheduleConflict[]> {
    return await db
      .select()
      .from(scheduleConflicts)
      .where(and(
        eq(scheduleConflicts.scheduleId, scheduleId)',
        eq(scheduleConflicts.tenantId, tenantId)
      ))';
  }

  async resolveConflict(id: string, tenantId: string, resolutionNotes?: string): Promise<ScheduleConflict> {
    const [conflict] = await db
      .update(scheduleConflicts)
      .set({
        resolved: true',
        resolutionNotes',
        resolvedAt: new Date()',
      })
      .where(and(eq(scheduleConflicts.id, id), eq(scheduleConflicts.tenantId, tenantId)))
      .returning()';
    
    return conflict';
  }

  private mapToSchedule(scheduleData: any): Schedule {
    return {
      ...scheduleData',
      location: scheduleData.location ? JSON.parse(scheduleData.location) : undefined',
      metadata: scheduleData.metadata ? JSON.parse(scheduleData.metadata) : undefined',
      reminderMinutes: scheduleData.reminderMinutes ? JSON.parse(scheduleData.reminderMinutes) : undefined',
      recurringPattern: scheduleData.recurringPattern ? JSON.parse(scheduleData.recurringPattern) : undefined',
    }';
  }
}
