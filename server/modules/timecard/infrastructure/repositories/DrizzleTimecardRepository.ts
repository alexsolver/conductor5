import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { db } from '../../../../db';
import { 
  timeRecords,
  timeBank, 
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
      .insert(timeRecords)
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
      .from(timeRecords)
      .where(
        and(
          eq(timeRecords.tenantId, tenantId),
          eq(timeRecords.userId, userId),
          gte(timeRecords.checkIn, startOfDay),
          lte(timeRecords.checkIn, endOfDay)
        )
      )
      .orderBy(asc(timeRecords.checkIn));
  }

  async getTimecardEntriesByUser(userId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [
      eq(timeRecords.userId, userId),
      eq(timeRecords.tenantId, tenantId)
    ];

    if (startDate) {
      conditions.push(gte(timeRecords.checkIn, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeRecords.checkIn, endDate));
    }

    return await db
      .select()
      .from(timeRecords)
      .where(and(...conditions))
      .orderBy(desc(timeRecords.checkIn));
  }

  async updateTimecardEntry(id: string, tenantId: string, data: any): Promise<any> {
    const [entry] = await db
      .update(timeRecords)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(timeRecords.id, id), eq(timeRecords.tenantId, tenantId)))
      .returning();
    return entry;
  }

  async deleteTimecardEntry(id: string, tenantId: string): Promise<void> {
    await db
      .delete(timeRecords)
      .where(and(eq(timeRecords.id, id), eq(timeRecords.tenantId, tenantId)));
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

  // Schedule Templates Implementation - Mock templates
  async createScheduleTemplate(data: any): Promise<any> {
    console.log('Schedule template creation not implemented - using mock');
    return {
      id: 'mock-template-' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
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

  async updateScheduleTemplate(id: string, tenantId: string, data: any): Promise<any> {
    console.log('Schedule template update not implemented - using mock');
    return { id, ...data, updatedAt: new Date() };
  }

  async deleteScheduleTemplate(id: string, tenantId: string): Promise<void> {
    console.log('Schedule template deletion not implemented - using mock');
  }

  // Hour Bank Implementation - Using timeBank table
  async createHourBankEntry(data: any): Promise<any> {
    const [entry] = await db
      .insert(timeBank)
      .values({
        tenantId: data.tenantId,
        userId: data.userId,
        balance: data.balance,
        description: data.description || '',
        type: data.type || 'credit'
      })
      .returning();
    return entry;
  }

  async getHourBankByUser(userId: string, tenantId: string, year?: number, month?: number): Promise<any[]> {
    const conditions = [
      eq(timeBank.userId, userId),
      eq(timeBank.tenantId, tenantId)
    ];

    return await db
      .select()
      .from(timeBank)
      .where(and(...conditions))
      .orderBy(desc(timeBank.createdAt));
  }

  async updateHourBankEntry(id: string, tenantId: string, data: any): Promise<any> {
    const [entry] = await db
      .update(timeBank)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(timeBank.id, id), eq(timeBank.tenantId, tenantId)))
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
      .from(timeBank)
      .where(and(
        eq(timeBank.userId, userId),
        eq(timeBank.tenantId, tenantId)
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