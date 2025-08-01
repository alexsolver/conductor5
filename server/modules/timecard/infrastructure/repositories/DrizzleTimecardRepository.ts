import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { db } from '../../../../db';
import { 
  timecardEntries, 
  hourBankEntries,
  workSchedules,
  absenceRequests,
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
      // Temporariamente retornando dados mockados até tabela ser criada
      console.log('createWorkSchedule: Retornando dados mockados temporariamente');
      const mockSchedule = {
        id: `mock-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return mockSchedule;
    } catch (error) {
      console.error('Error creating work schedule:', error);
      throw error;
    }
  }

  async getWorkSchedulesByUser(userId: string, tenantId: string): Promise<any[]> {
    try {
      // Temporariamente retornando array vazio até tabela ser criada
      console.log('getWorkSchedulesByUser: Retornando array vazio temporariamente');
      return [];
    } catch (error) {
      console.error('Error fetching user work schedules:', error);
      throw error;
    }
  }

  async getAllWorkSchedules(tenantId: string): Promise<any[]> {
    try {
      // Temporariamente retornando array vazio até tabela ser criada
      console.log('getAllWorkSchedules: Retornando array vazio temporariamente');
      return [];
    } catch (error) {
      console.error('Error fetching work schedules:', error);
      throw error;
    }
  }

  async updateWorkSchedule(id: string, tenantId: string, data: any): Promise<any> {
    try {
      const [schedule] = await db
        .update(workSchedules)
        .set({ 
          ...data, 
          workDays: data.workDays ? JSON.stringify(data.workDays) : undefined,
          updatedAt: new Date() 
        })
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

      return { templates };
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