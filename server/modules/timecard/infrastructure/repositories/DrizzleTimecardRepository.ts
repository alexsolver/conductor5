import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { db } from '../../../../db';
import { 
  timecardEntries,
  hourBankEntries, 
  users
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
      .values({
        tenantId: data.tenantId,
        userId: data.userId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd,
        totalHours: data.totalHours,
        notes: data.notes,
        location: data.location,
        isManualEntry: data.isManualEntry || false,
        approvedBy: data.approvedBy,
        status: data.status || 'pending'
      })
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

  // Work Schedules Implementation - Using mock data until work_schedules table is created
  async getAllWorkSchedules(tenantId: string): Promise<any[]> {
    try {
      console.log('[DRIZZLE-QA] Fetching work schedules for tenant:', tenantId);

      // Get users for this tenant to create mock schedules
      const usersList = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true)
        ));

      console.log('[DRIZZLE-QA] Found users for schedules:', usersList.length);

      // Return mock schedules based on users
      return usersList.map(user => ({
        id: `schedule-${user.id}`,
        userId: user.id,
        scheduleName: 'Escala Padrão',
        workDays: [1, 2, 3, 4, 5], // Monday to Friday
        startTime: '08:00',
        endTime: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        isActive: true,
        tenantId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Usuário'
      }));
    } catch (error: any) {
      console.error('[DRIZZLE-QA] Error fetching work schedules:', error);
      return [];
    }
  }

  async createWorkSchedule(data: any): Promise<any> {
    console.log('Work schedule creation not implemented - table missing');
    return {
      id: `schedule-${Date.now()}`,
      tenantId: data.tenantId,
      userId: data.userId,
      scheduleName: data.scheduleName || 'Nova Escala',
      workDays: data.workDays || [1, 2, 3, 4, 5],
      startTime: data.startTime,
      endTime: data.endTime,
      breakStart: data.breakStart,
      breakEnd: data.breakEnd,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateWorkSchedule(id: string, tenantId: string, data: any): Promise<any> {
    console.log('Work schedule update not implemented - table missing');
    return { id, ...data, updatedAt: new Date() };
  }

  async deleteWorkSchedule(id: string, tenantId: string): Promise<void> {
    console.log('Work schedule deletion not implemented - table missing');
  }

  async getWorkSchedulesByUser(userId: string, tenantId: string): Promise<any[]> {
    try {
      console.log('Fetching work schedules for user:', userId);
      
      // Get user info
      const user = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        })
        .from(users)
        .where(and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId)
        ))
        .limit(1);

      if (user.length === 0) {
        return [];
      }

      // Return mock schedule for this user
      return [{
        id: `schedule-${userId}`,
        tenantId: tenantId,
        userId: userId,
        userName: `${user[0].firstName || ''} ${user[0].lastName || ''}`.trim() || user[0].email || 'Usuário',
        scheduleName: 'Escala Padrão',
        workDays: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    } catch (error) {
      console.error('Error fetching user work schedules:', error);
      return [];
    }
  }

  // Absence Requests Implementation - Mock implementation since table doesn't exist
  async createAbsenceRequest(data: any): Promise<any> {
    console.log('Absence request creation not implemented - table missing');
    return { id: 'mock-id', ...data, status: 'pending' };
  }

  async getAbsenceRequestsByUser(userId: string, tenantId: string): Promise<any[]> {
    console.log('Absence requests query not implemented - table missing');
    return [];
  }

  async getPendingAbsenceRequests(tenantId: string): Promise<any[]> {
    console.log('Pending absence requests query not implemented - table missing');
    return [];
  }

  async updateAbsenceRequest(id: string, tenantId: string, data: any): Promise<any> {
    console.log('Absence request update not implemented - table missing');
    return { id, ...data };
  }

  async approveAbsenceRequest(id: string, tenantId: string, approvedBy: string): Promise<any> {
    console.log('Absence request approval not implemented - table missing');
    return { id, status: 'approved', approvedBy };
  }

  async rejectAbsenceRequest(id: string, tenantId: string, approvedBy: string, reason: string): Promise<any> {
    console.log('Absence request rejection not implemented - table missing');
    return { id, status: 'rejected', approvedBy, rejectionReason: reason };
  }

  // Schedule Templates Implementation
  async createScheduleTemplate(data: any): Promise<any> {
    try {
      const { scheduleTemplates } = await import('@shared/schema');
      
      const [template] = await db
        .insert(scheduleTemplates)
        .values({
          tenantId: data.tenantId,
          name: data.name,
          description: data.description,
          scheduleType: data.scheduleType,
          workDays: JSON.stringify(data.workDays),
          startTime: data.startTime,
          endTime: data.endTime,
          breakStart: data.breakStart,
          breakEnd: data.breakEnd,
          flexibilityWindow: data.flexibilityWindow || 0,
          isActive: data.isActive ?? true,
        })
        .returning();

      console.log('[TEMPLATES-DEBUG] Created new template:', template.name);
      return template;
    } catch (error) {
      console.error('Error creating schedule template:', error);
      throw error;
    }
  }

  async getScheduleTemplates(tenantId: string): Promise<any[]> {
    try {
      // Get real templates from database using existing db connection
      const { scheduleTemplates } = await import('@shared/schema');
      
      const templates = await db
        .select()
        .from(scheduleTemplates)
        .where(eq(scheduleTemplates.tenantId, tenantId))
        .orderBy(desc(scheduleTemplates.createdAt));

      console.log(`[TEMPLATES-DEBUG] Found ${templates.length} real templates for tenant ${tenantId}`);
      
      // Combinar templates reais com templates padrão
      const defaultTemplates = [
        {
          id: '5x2',
          tenantId,
          name: '5x2',
          description: '5 dias úteis, 2 dias de folga',
          scheduleName: '5x2',
          scheduleType: '5x2',
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
          scheduleType: '6x1',
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

      // Retornar templates customizados + padrão
      return [...templates, ...defaultTemplates];
    } catch (error) {
      console.error('Error fetching schedule templates:', error);
      // Em caso de erro, retornar apenas os templates padrão
      return [
        {
          id: '5x2',
          tenantId,
          name: '5x2',
          description: '5 dias úteis, 2 dias de folga',
          scheduleName: '5x2',
          scheduleType: '5x2',
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
          scheduleType: '6x1',
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
    }
  }

  async updateScheduleTemplate(id: string, tenantId: string, data: any): Promise<any> {
    console.log('Schedule template update not implemented - using mock');
    return { id, ...data, updatedAt: new Date() };
  }

  async deleteScheduleTemplate(id: string, tenantId: string): Promise<void> {
    try {
      const { scheduleTemplates } = await import('@shared/schema');
      
      await db
        .delete(scheduleTemplates)
        .where(and(
          eq(scheduleTemplates.id, id),
          eq(scheduleTemplates.tenantId, tenantId)
        ));

      console.log('[TEMPLATES-DEBUG] Deleted template:', id);
    } catch (error) {
      console.error('Error deleting schedule template:', error);
      throw error;
    }
  }

  // Hour Bank Implementation - Using hourBankEntries table
  async createHourBankEntry(data: any): Promise<any> {
    const [entry] = await db
      .insert(hourBankEntries)
      .values({
        tenantId: data.tenantId,
        userId: data.userId,
        date: data.date || new Date(),
        regularHours: data.regularHours || '0',
        overtimeHours: data.overtimeHours || '0',
        compensatedHours: data.compensatedHours || '0',
        balance: data.balance || '0',
        type: data.type || 'credit',
        description: data.description || ''
      })
      .returning();
    return entry;
  }

  async getHourBankByUser(userId: string, tenantId: string, year?: number, month?: number): Promise<any[]> {
    const conditions = [
      eq(hourBankEntries.userId, userId),
      eq(hourBankEntries.tenantId, tenantId)
    ];

    return await db
      .select()
      .from(hourBankEntries)
      .where(and(...conditions))
      .orderBy(desc(hourBankEntries.createdAt));
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
        totalBalance: sql<number>`COALESCE(SUM(balance), 0)`
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
        ));

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