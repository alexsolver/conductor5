import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { db } from '../../../../db';
import { 
  timecardEntries,
  hourBankEntries, 
  workSchedules,
  absenceRequests,
  scheduleTemplates,
  users 
} from '../../../../../shared/schema';

export interface TimecardRepository {
  // Timecard Entries
  createTimecardEntry(data: any): Promise<any>;
  getTimecardEntriesByUser(userId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  updateTimecardEntry(id: string, tenantId: string, data: any): Promise<any>;
  deleteTimecardEntry(id: string, tenantId: string): Promise<void>;

  // Work Schedules
  createWorkSchedule(data: any): Promise<any>;
  getWorkSchedulesByUser(userId: string, tenantId: string): Promise<any[]>;
  getAllWorkSchedules(tenantId: string): Promise<any[]>;
  updateWorkSchedule(id: string, tenantId: string, data: any): Promise<any>;
  deleteWorkSchedule(id: string, tenantId: string): Promise<void>;

  // Absence Requests
  createAbsenceRequest(data: any): Promise<any>;
  getAbsenceRequestsByUser(userId: string, tenantId: string): Promise<any[]>;
  getPendingAbsenceRequests(tenantId: string): Promise<any[]>;
  updateAbsenceRequest(id: string, tenantId: string, data: any): Promise<any>;
  approveAbsenceRequest(id: string, tenantId: string, approvedBy: string): Promise<any>;
  rejectAbsenceRequest(id: string, tenantId: string, approvedBy: string, reason: string): Promise<any>;

  // Schedule Templates
  createScheduleTemplate(data: any): Promise<any>;
  getScheduleTemplates(tenantId: string): Promise<any[]>;
  updateScheduleTemplate(id: string, tenantId: string, data: any): Promise<any>;
  deleteScheduleTemplate(id: string, tenantId: string): Promise<void>;

  // Hour Bank
  createHourBankEntry(data: any): Promise<any>;
  getHourBankByUser(userId: string, tenantId: string, year?: number, month?: number): Promise<any[]>;
  updateHourBankEntry(id: string, tenantId: string, data: any): Promise<any>;
  calculateHourBankBalance(userId: string, tenantId: string): Promise<number>;

  // Flexible Work Arrangements
  createFlexibleWorkArrangement(data: any): Promise<any>;
  getFlexibleWorkArrangements(tenantId: string): Promise<any[]>;
  updateFlexibleWorkArrangement(id: string, tenantId: string, data: any): Promise<any>;

  // Shift Swap Requests
  createShiftSwapRequest(data: any): Promise<any>;
  getShiftSwapRequests(tenantId: string): Promise<any[]>;
  updateShiftSwapRequest(id: string, tenantId: string, data: any): Promise<any>;
}

export class DrizzleTimecardRepository implements TimecardRepository {
  // Timecard Entries Implementation
  async createTimecardEntry(data: any): Promise<any> {
    const [entry] = await db
      .insert(timecardEntries)
      .values(data)
      .returning();
    return entry;
  }

  async getTimecardEntriesByUserAndDate(userId: string, date: string, tenantId: string): Promise<any[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(timecardEntries)
      .where(
        and(
          eq(timecardEntries.tenantId, tenantId),
          eq(timecardEntries.userId, userId),
          gte(timecardEntries.checkIn, startOfDay),
          lte(timecardEntries.checkIn, endOfDay)
        )
      )
      .orderBy(asc(timecardEntries.checkIn));
  }

  async getTimecardEntriesByUser(userId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [
      eq(timecardEntries.userId, userId),
      eq(timecardEntries.tenantId, tenantId)
    ];

    if (startDate) {
      conditions.push(gte(timecardEntries.checkIn, startDate));
    }
    if (endDate) {
      conditions.push(lte(timecardEntries.checkIn, endDate));
    }

    return await db
      .select()
      .from(timecardEntries)
      .where(and(...conditions))
      .orderBy(desc(timecardEntries.checkIn));
  }

  async updateTimecardEntry(id: string, tenantId: string, data: any): Promise<any> {
    const [entry] = await db
      .update(timecardEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(timecardEntries.id, id), eq(timecardEntries.tenantId, tenantId)))
      .returning();
    return entry;
  }

  async deleteTimecardEntry(id: string, tenantId: string): Promise<void> {
    await db
      .delete(timecardEntries)
      .where(and(eq(timecardEntries.id, id), eq(timecardEntries.tenantId, tenantId)));
  }

  // Work Schedules Implementation
  async createWorkSchedule(data: any): Promise<any> {
    try {
      // Ensure workDays is properly formatted as array
      const workDaysArray = Array.isArray(data.workDays) ? data.workDays : [1,2,3,4,5];
      
      const [schedule] = await db
        .insert(workSchedules)
        .values({
          tenantId: data.tenantId,
          userId: data.userId,
          scheduleName: data.scheduleType || 'Default Schedule',
          scheduleType: data.scheduleType || '5x2',
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : null,
          workDays: workDaysArray,
          startTime: data.startTime,
          endTime: data.endTime,
          breakStart: data.breakStart || null,
          breakEnd: data.breakEnd || null,
          breakDurationMinutes: data.breakDurationMinutes || 60,
          isActive: data.isActive ?? true
        })
        .returning();
      
      return schedule;
    } catch (error) {
      console.error('Error creating work schedule:', error);
      throw error;
    }
  }

  async getWorkSchedulesByUser(userId: string, tenantId: string): Promise<any[]> {
    try {
      const schedules = await db
        .select({
          id: workSchedules.id,
          tenantId: workSchedules.tenantId,
          userId: workSchedules.userId,
          scheduleName: workSchedules.scheduleName,
          workDays: workSchedules.workDays,
          startTime: workSchedules.startTime,
          endTime: workSchedules.endTime,
          breakStart: workSchedules.breakStart,
          breakEnd: workSchedules.breakEnd,
          isActive: workSchedules.isActive,
          createdAt: workSchedules.createdAt,
          updatedAt: workSchedules.updatedAt,
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(workSchedules)
        .leftJoin(users, eq(workSchedules.userId, users.id))
        .where(and(
          eq(workSchedules.userId, userId),
          eq(workSchedules.tenantId, tenantId)
        ))
        .orderBy(desc(workSchedules.createdAt));

      return schedules.map(schedule => {
        // Safely process workDays
        let processedWorkDays: number[] = [1,2,3,4,5];
        
        try {
          if (schedule.workDays) {
            if (Array.isArray(schedule.workDays)) {
              processedWorkDays = schedule.workDays;
            } else if (typeof schedule.workDays === 'string') {
              processedWorkDays = JSON.parse(schedule.workDays);
            } else {
              processedWorkDays = schedule.workDays as number[];
            }
          }
        } catch (error) {
          console.error('Error processing workDays for user schedule:', error);
          processedWorkDays = [1,2,3,4,5];
        }

        return {
          id: schedule.id,
          tenantId: schedule.tenantId,
          userId: schedule.userId,
          userName: `${schedule.firstName || ''} ${schedule.lastName || ''}`.trim() || 'Usuário',
          scheduleType: schedule.scheduleName || '5x2',
          startDate: schedule.createdAt?.toISOString() || new Date().toISOString(),
          endDate: schedule.updatedAt?.toISOString() || null,
          workDays: processedWorkDays,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          breakDurationMinutes: schedule.breakDurationMinutes || 60,
          isActive: schedule.isActive ?? true,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        };
      });
    } catch (error) {
      console.error('Error fetching user work schedules:', error);
      throw error;
    }
  }

  async getAllWorkSchedules(tenantId: string): Promise<any[]> {
    try {
      console.log('[DRIZZLE-QA] Fetching work schedules for tenant:', tenantId);
      
      const schedules = await db
        .select({
          id: workSchedules.id,
          tenantId: workSchedules.tenantId,
          userId: workSchedules.userId,
          scheduleName: workSchedules.scheduleName,
          workDays: workSchedules.workDays,
          startTime: workSchedules.startTime,
          endTime: workSchedules.endTime,
          breakStart: workSchedules.breakStart,
          breakEnd: workSchedules.breakEnd,
          isActive: workSchedules.isActive,
          createdAt: workSchedules.createdAt,
          updatedAt: workSchedules.updatedAt,
          // User fields from JOIN
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(workSchedules)
        .leftJoin(users, eq(workSchedules.userId, users.id))
        .where(eq(workSchedules.tenantId, tenantId))
        .orderBy(desc(workSchedules.createdAt));

      console.log('[DRIZZLE-QA] Raw schedules found:', schedules.length);

      const mappedSchedules = schedules.map(schedule => {
        // Safely process workDays from JSONB field
        let processedWorkDays: number[] = [1,2,3,4,5]; // Default Monday-Friday
        
        try {
          if (schedule.workDays) {
            if (Array.isArray(schedule.workDays)) {
              processedWorkDays = schedule.workDays;
            } else if (typeof schedule.workDays === 'string') {
              processedWorkDays = JSON.parse(schedule.workDays);
            } else {
              // If it's already a parsed object from JSONB
              processedWorkDays = schedule.workDays as number[];
            }
          }
        } catch (parseError) {
          console.error('[DRIZZLE-QA] workDays parsing error:', parseError, schedule.workDays);
          processedWorkDays = [1,2,3,4,5]; // Fallback to default
        }

        // Map database fields to frontend expected format
        return {
          id: schedule.id,
          tenantId: schedule.tenantId,
          userId: schedule.userId,
          userName: `${schedule.firstName || ''} ${schedule.lastName || ''}`.trim() || 'Usuário',
          scheduleType: schedule.scheduleName || '5x2',
          startDate: schedule.createdAt?.toISOString() || new Date().toISOString(),
          endDate: schedule.updatedAt?.toISOString() || null,
          workDays: processedWorkDays,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          breakDurationMinutes: schedule.breakDurationMinutes || 60,
          isActive: schedule.isActive ?? true,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        };
      });

      console.log('[DRIZZLE-QA] Processed schedules:', mappedSchedules.length);
      return mappedSchedules;
    } catch (error) {
      console.error('[DRIZZLE-QA] Error fetching work schedules:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async updateWorkSchedule(id: string, tenantId: string, data: any): Promise<any> {
    try {
      // Ensure workDays is properly formatted
      const workDaysArray = Array.isArray(data.workDays) ? data.workDays : [1,2,3,4,5];
      
      const updateData = {
        scheduleName: data.scheduleType || data.scheduleName,
        scheduleType: data.scheduleType,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : null,
        workDays: workDaysArray,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart || null,
        breakEnd: data.breakEnd || null,
        breakDurationMinutes: data.breakDurationMinutes || 60,
        isActive: data.isActive ?? true,
        updatedAt: new Date()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const [schedule] = await db
        .update(workSchedules)
        .set(updateData)
        .where(and(eq(workSchedules.id, id), eq(workSchedules.tenantId, tenantId)))
        .returning();
      
      return schedule;
    } catch (error) {
      console.error('Error updating work schedule:', error);
      throw error;
    }
  }

  async deleteWorkSchedule(id: string, tenantId: string): Promise<void> {
    try {
      await db
        .delete(workSchedules)
        .where(and(eq(workSchedules.id, id), eq(workSchedules.tenantId, tenantId)));
    } catch (error) {
      console.error('Error deleting work schedule:', error);
      throw error;
    }
  }

  // Absence Requests Implementation
  async createAbsenceRequest(data: any): Promise<any> {
    const [request] = await db
      .insert(absenceRequests)
      .values(data)
      .returning();
    return request;
  }

  async getAbsenceRequestsByUser(userId: string, tenantId: string): Promise<any[]> {
    return await db
      .select()
      .from(absenceRequests)
      .leftJoin(users, eq(absenceRequests.userId, users.id))
      .where(and(
        eq(absenceRequests.userId, userId),
        eq(absenceRequests.tenantId, tenantId)
      ))
      .orderBy(desc(absenceRequests.createdAt));
  }

  async getPendingAbsenceRequests(tenantId: string): Promise<any[]> {
    return await db
      .select()
      .from(absenceRequests)
      .leftJoin(users, eq(absenceRequests.userId, users.id))
      .where(and(
        eq(absenceRequests.tenantId, tenantId),
        eq(absenceRequests.status, 'pending')
      ))
      .orderBy(asc(absenceRequests.startDate));
  }

  async updateAbsenceRequest(id: string, tenantId: string, data: any): Promise<any> {
    const [request] = await db
      .update(absenceRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(absenceRequests.id, id), eq(absenceRequests.tenantId, tenantId)))
      .returning();
    return request;
  }

  async approveAbsenceRequest(id: string, tenantId: string, approvedBy: string): Promise<any> {
    const [request] = await db
      .update(absenceRequests)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(absenceRequests.id, id), eq(absenceRequests.tenantId, tenantId)))
      .returning();
    return request;
  }

  async rejectAbsenceRequest(id: string, tenantId: string, approvedBy: string, reason: string): Promise<any> {
    const [request] = await db
      .update(absenceRequests)
      .set({
        status: 'rejected',
        approvedBy,
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(and(eq(absenceRequests.id, id), eq(absenceRequests.tenantId, tenantId)))
      .returning();
    return request;
  }

  // Schedule Templates Implementation
  async createScheduleTemplate(data: any): Promise<any> {
    const [template] = await db
      .insert(scheduleTemplates)
      .values(data)
      .returning();
    return template;
  }

  async getScheduleTemplates(tenantId: string): Promise<any[]> {
    try {
      const templates = await db
        .select({
          id: scheduleTemplates.id,
          tenantId: scheduleTemplates.tenantId,
          name: scheduleTemplates.name,
          description: scheduleTemplates.description,
          scheduleType: scheduleTemplates.scheduleType,
          workDays: scheduleTemplates.workDays,
          startTime: scheduleTemplates.startTime,
          endTime: scheduleTemplates.endTime,
          breakStart: scheduleTemplates.breakStart,
          breakEnd: scheduleTemplates.breakEnd,
          flexibilityWindow: scheduleTemplates.flexibilityWindow,
          isActive: scheduleTemplates.isActive,
          createdAt: scheduleTemplates.createdAt,
          updatedAt: scheduleTemplates.updatedAt
        })
        .from(scheduleTemplates)
        .where(
          and(
            eq(scheduleTemplates.tenantId, tenantId),
            eq(scheduleTemplates.isActive, true)
          )
        )
        .orderBy(desc(scheduleTemplates.createdAt));

      return templates;
    } catch (error) {
      console.error('Error fetching schedule templates:', error);
      throw error;
    }
  }

  async updateScheduleTemplate(id: string, tenantId: string, data: any): Promise<any> {
    const [template] = await db
      .update(scheduleTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(scheduleTemplates.id, id), eq(scheduleTemplates.tenantId, tenantId)))
      .returning();
    return template;
  }

  async deleteScheduleTemplate(id: string, tenantId: string): Promise<void> {
    await db
      .update(scheduleTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(scheduleTemplates.id, id), eq(scheduleTemplates.tenantId, tenantId)));
  }

  // Hour Bank Implementation
  async createHourBankEntry(data: any): Promise<any> {
    const [entry] = await db
      .insert(hourBankEntries)
      .values(data)
      .returning();
    return entry;
  }

  async getHourBankByUser(userId: string, tenantId: string, year?: number, month?: number): Promise<any[]> {
    const conditions = [
      eq(hourBankEntries.userId, userId),
      eq(hourBankEntries.tenantId, tenantId)
    ];

    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      conditions.push(gte(hourBankEntries.date, startDate));
      conditions.push(lte(hourBankEntries.date, endDate));
    }

    return await db
      .select()
      .from(hourBankEntries)
      .where(and(...conditions))
      .orderBy(desc(hourBankEntries.date));
  }

  async updateHourBankEntry(id: string, tenantId: string, data: any): Promise<any> {
    const [entry] = await db
      .update(hourBankEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(hourBankEntries.id, id), eq(hourBankEntries.tenantId, tenantId)))
      .returning();
    return entry;
  }

  async calculateHourBankBalance(userId: string, tenantId: string): Promise<number> {
    const result = await db
      .select({
        totalBalance: sql<number>`COALESCE(SUM(CASE 
          WHEN type = 'credit' THEN balance 
          WHEN type = 'debit' THEN -balance 
          ELSE 0 
        END), 0)`
      })
      .from(hourBankEntries)
      .where(and(
        eq(hourBankEntries.userId, userId),
        eq(hourBankEntries.tenantId, tenantId)
      ));

    return result[0]?.totalBalance || 0;
  }

  // Flexible Work Arrangements Implementation (placeholder)
  async createFlexibleWorkArrangement(data: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async getFlexibleWorkArrangements(tenantId: string): Promise<any[]> {
    throw new Error('Not implemented yet');
  }

  async updateFlexibleWorkArrangement(id: string, tenantId: string, data: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  // Shift Swap Requests Implementation (placeholder)
  async createShiftSwapRequest(data: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async getShiftSwapRequests(tenantId: string): Promise<any[]> {
    throw new Error('Not implemented yet');
  }

  async updateShiftSwapRequest(id: string, tenantId: string, data: any): Promise<any> {
    throw new Error('Not implemented yet');
  }
}