import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { db } from '../../../../db';
import { 
  timecardEntries,
  hourBankEntries, 
  users,
  workSchedules,
  absenceRequests,
  scheduleTemplates
} from '../../../../../shared/schema-master';

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

  // Users
  getUsers(tenantId: string): Promise<any[]>;
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
  async getAllWorkSchedules(tenantId: string): Promise<any[]> {
    try {
      console.log('[DRIZZLE-QA] Fetching work schedules for tenant:', tenantId);

      const schedules = await db
        .select({
          id: workSchedules.id,
          userId: workSchedules.userId,
          scheduleName: workSchedules.scheduleName,
          workDays: workSchedules.workDays,
          startTime: workSchedules.startTime,
          endTime: workSchedules.endTime,
          breakStart: workSchedules.breakStart,
          breakEnd: workSchedules.breakEnd,
          isActive: workSchedules.isActive,
          tenantId: workSchedules.tenantId,
          createdAt: workSchedules.createdAt,
          updatedAt: workSchedules.updatedAt,
          userName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, 'Usuário')`
        })
        .from(workSchedules)
        .leftJoin(users, eq(workSchedules.userId, users.id))
        .where(eq(workSchedules.tenantId, tenantId))
        .orderBy(desc(workSchedules.createdAt));

      console.log('[DRIZZLE-QA] Found schedules:', schedules.length);

      // Processar workDays para garantir formato correto
      const processedSchedules = schedules.map(schedule => {
        let workDaysArray = [1,2,3,4,5]; // default

        try {
          if (schedule.workDays) {
            if (Array.isArray(schedule.workDays)) {
              workDaysArray = schedule.workDays;
            } else if (typeof schedule.workDays === 'string') {
              workDaysArray = JSON.parse(schedule.workDays);
            }
          }
        } catch (error) {
          console.error('Error processing workDays:', error);
          workDaysArray = [1,2,3,4,5];
        }

        return {
          id: schedule.id,
          userId: schedule.userId,
          scheduleName: schedule.scheduleName,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          workDays: workDaysArray,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          breakDurationMinutes: schedule.breakDurationMinutes,
          isActive: schedule.isActive,
          tenantId: schedule.tenantId,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          userName: schedule.userName || 'Usuário'
        };
      });

      return processedSchedules;
    } catch (error: any) {
      console.error('[DRIZZLE-QA] Error fetching work schedules:', error);
      return [];
    }
  }

  async createWorkSchedule(data: any): Promise<any> {
    const workDaysArray = Array.isArray(data.workDays) 
      ? data.workDays 
      : (typeof data.workDays === 'string' ? JSON.parse(data.workDays) : [1,2,3,4,5]);

    const [schedule] = await db
      .insert(workSchedules)
      .values({
        ...data,
        workDays: workDaysArray
      })
      .returning();
    return schedule;
  }

  async updateWorkSchedule(id: string, tenantId: string, data: any): Promise<any> {
    const [schedule] = await db
      .update(workSchedules)
      .set({ 
        ...data, 
        workDays: Array.isArray(data.workDays) ? data.workDays : JSON.parse(data.workDays || '[1,2,3,4,5]'),
        updatedAt: new Date() 
      })
      .where(and(eq(workSchedules.id, id), eq(workSchedules.tenantId, tenantId)))
      .returning();
    return schedule;
  }

  async deleteWorkSchedule(id: string, tenantId: string): Promise<void> {
    await db
      .delete(workSchedules)
      .where(and(eq(workSchedules.id, id), eq(workSchedules.tenantId, tenantId)));
  }

  async getScheduleTemplates(tenantId: string): Promise<any[]> {
    try {
      // Return basic predefined templates
      return [
        {
          id: '5x2',
          tenantId,
          name: '5x2',
          description: '5 dias úteis, 2 dias de folga',
          scheduleName: '5x2',
          workDays: [1,2,3,4,5],
          startTime: '08:00',
          endTime: '18:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '6x1',
          tenantId,
          name: '6x1',
          description: '6 dias úteis, 1 dia de folga',
          scheduleName: '6x1',
          workDays: [1,2,3,4,5,6],
          startTime: '08:00',
          endTime: '18:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Error fetching schedule templates:', error);
      return [];
    }
  }



  async deleteWorkSchedule(id: string, tenantId: string): Promise<void> {
    try {
      await db
        .delete(workSchedules)
        .where(and(eq(workSchedules.id, id), eq(workSchedules.tenantId, tenantId)));
    } catch (error) {
      console.error('[DRIZZLE-QA] Error deleting work schedule:', error);
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
        let processedWorkDays: number[] = [1,2,3,4,5];

        try {
          if (schedule.workDays) {
            if (Array.isArray(schedule.workDays)) {
              processedWorkDays = schedule.workDays;
            } else if (typeof schedule.workDays === 'string') {
              processedWorkDays = JSON.parse(schedule.workDays);
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
          scheduleName: schedule.scheduleName || '5x2',
          workDays: processedWorkDays,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          breakStart: schedule.breakStart,
          breakEnd: schedule.breakEnd,
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

  // Absence Requests Implementation
  async createAbsenceRequest(data: any): Promise<any> {
    try {
      const [request] = await db
        .insert(absenceRequests)
        .values({
          tenantId: data.tenantId,
          userId: data.userId,
          absenceType: data.absenceType,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          status: 'pending'
        })
        .returning();
      return request;
    } catch (error) {
      console.error('Error creating absence request:', error);
      return [];
    }
  }

  async getAbsenceRequestsByUser(userId: string, tenantId: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(absenceRequests)
        .where(and(
          eq(absenceRequests.userId, userId),
          eq(absenceRequests.tenantId, tenantId)
        ))
        .orderBy(desc(absenceRequests.createdAt));
    } catch (error) {
      console.error('Error fetching user absence requests:', error);
      return [];
    }
  }

  async getPendingAbsenceRequests(tenantId: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(absenceRequests)
        .where(and(
          eq(absenceRequests.tenantId, tenantId),
          eq(absenceRequests.status, 'pending')
        ))
        .orderBy(desc(absenceRequests.createdAt));
    } catch (error) {
      console.error('Error fetching pending absence requests:', error);
      return [];
    }
  }

  async updateAbsenceRequest(id: string, tenantId: string, data: any): Promise<any> {
    try {
      const [request] = await db
        .update(absenceRequests)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(absenceRequests.id, id), eq(absenceRequests.tenantId, tenantId)))
        .returning();
      return request;
    } catch (error) {
      console.error('Error updating absence request:', error);
      throw error;
    }
  }

  async approveAbsenceRequest(id: string, tenantId: string, approvedBy: string): Promise<any> {
    try {
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
    } catch (error) {
      console.error('Error approving absence request:', error);
      throw error;
    }
  }

  async rejectAbsenceRequest(id: string, tenantId: string, approvedBy: string, reason: string): Promise<any> {
    try {
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
    } catch (error) {
      console.error('Error rejecting absence request:', error);
      throw error;
    }
  }

  // Schedule Templates Implementation - Real Database Implementation
  async createScheduleTemplate(data: any): Promise<any> {
    try {
      console.log('[DRIZZLE-QA] Creating schedule template:', data);
      
      const [template] = await db
        .insert(scheduleTemplates)
        .values({
          tenantId: data.tenantId,
          name: data.name,
          description: data.description,
          scheduleType: data.scheduleType || data.scheduleName,
          workDays: data.workDays,
          startTime: data.startTime,
          endTime: data.endTime,
          breakStart: data.breakStart,
          breakEnd: data.breakEnd,
          flexibilityWindow: data.flexibilityWindow || 0,
          isActive: true,
          createdBy: data.createdBy
        })
        .returning();
      
      console.log('[DRIZZLE-QA] Template created with ID:', template.id);
      return template;
    } catch (error) {
      console.error('[DRIZZLE-QA] Error creating schedule template:', error);
      throw error;
    }
  }

  async getScheduleTemplates(tenantId: string): Promise<any[]> {
    try {
      console.log('[DRIZZLE-QA] Fetching schedule templates for tenant:', tenantId);
      
      const templates = await db
        .select()
        .from(scheduleTemplates)
        .where(and(
          eq(scheduleTemplates.tenantId, tenantId),
          eq(scheduleTemplates.isActive, true)
        ))
        .orderBy(asc(scheduleTemplates.name));

      console.log('[DRIZZLE-QA] Found templates:', templates.length);
      
      return templates.map(template => ({
        id: template.id,
        tenantId: template.tenantId,
        name: template.name,
        description: template.description,
        scheduleName: template.scheduleType,
        scheduleType: template.scheduleType,
        workDays: template.workDays,
        startTime: template.startTime,
        endTime: template.endTime,
        breakStart: template.breakStart,
        breakEnd: template.breakEnd,
        flexibilityWindow: template.flexibilityWindow,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }));
    } catch (error) {
      console.error('[DRIZZLE-QA] Error fetching schedule templates:', error);
      return [];
    }
  }

  async updateScheduleTemplate(id: string, tenantId: string, data: any): Promise<any> {
    try {
      console.log('[DRIZZLE-QA] Updating schedule template:', id, data);
      
      const [template] = await db
        .update(scheduleTemplates)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(and(
          eq(scheduleTemplates.id, id),
          eq(scheduleTemplates.tenantId, tenantId)
        ))
        .returning();
      
      console.log('[DRIZZLE-QA] Template updated:', template.id);
      return template;
    } catch (error) {
      console.error('[DRIZZLE-QA] Error updating schedule template:', error);
      throw error;
    }
  }

  async deleteScheduleTemplate(id: string, tenantId: string): Promise<void> {
    try {
      console.log('[DRIZZLE-QA] Deleting schedule template:', id, 'for tenant:', tenantId);
      
      await db
        .update(scheduleTemplates)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(scheduleTemplates.id, id),
          eq(scheduleTemplates.tenantId, tenantId)
        ));
      
      console.log('[DRIZZLE-QA] Template soft deleted:', id);
    } catch (error) {
      console.error('[DRIZZLE-QA] Error deleting schedule template:', error);
      throw error;
    }
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

  // Users Implementation - Critical for WorkSchedules page
  async getUsers(tenantId: string): Promise<any[]> {
    try {
      console.log('[DRIZZLE-QA] Fetching users for tenant:', tenantId);
      
      const usersList = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          tenantId: users.tenantId,
          isActive: users.isActive
        })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
        ))
        .orderBy(asc(users.firstName), asc(users.lastName));

      console.log('[DRIZZLE-QA] Found users:', usersList.length);
      
      return usersList.map(user => ({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Usuário',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        isActive: user.isActive
      }));
    } catch (error) {
      console.error('[DRIZZLE-QA] Error fetching users:', error);
      return [];
    }
  }
}