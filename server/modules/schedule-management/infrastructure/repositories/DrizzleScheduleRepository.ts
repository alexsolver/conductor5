// Drizzle Schedule Repository - Infrastructure Layer
import { eq, and, gte, lte, desc, asc, inArray, like, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { 
  schedules, 
  activityTypes, 
  agentAvailability, 
  scheduleConflicts,
  users,
  customers 
} from '@shared/schema';
import { IScheduleRepository } from '../../application/repositories/IScheduleRepository';
import { ScheduleEntity, ActivityTypeEntity, AgentAvailabilityEntity, ScheduleConflictEntity } from '../../domain/entities/Schedule';

export class DrizzleScheduleRepository implements IScheduleRepository {
  
  // Schedule CRUD
  async createSchedule(scheduleData: Omit<ScheduleEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleEntity> {
    const [schedule] = await db
      .insert(schedules)
      .values({
        ...scheduleData,
        startDateTime: scheduleData.startDateTime,
        endDateTime: scheduleData.endDateTime,
        coordinates: scheduleData.coordinates ? JSON.stringify(scheduleData.coordinates) : null,
        recurringPattern: scheduleData.recurringPattern ? JSON.stringify(scheduleData.recurringPattern) : null,
      })
      .returning();
    
    return this.mapScheduleToEntity(schedule);
  }

  async getScheduleById(id: string, tenantId: string): Promise<ScheduleEntity | null> {
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)));
    
    return schedule ? this.mapScheduleToEntity(schedule) : null;
  }

  async getSchedulesByAgent(agentId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<ScheduleEntity[]> {
    const conditions = [
      eq(schedules.agentId, agentId),
      eq(schedules.tenantId, tenantId)
    ];
    
    if (startDate) {
      conditions.push(gte(schedules.startDateTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(schedules.endDateTime, endDate));
    }
    
    const results = await db
      .select()
      .from(schedules)
      .where(and(...conditions))
      .orderBy(asc(schedules.startDateTime));
    
    return results.map(this.mapScheduleToEntity);
  }

  async getSchedulesByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<ScheduleEntity[]> {
    const results = await db
      .select({
        schedule: schedules,
        agent: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
        },
        activityType: activityTypes,
      })
      .from(schedules)
      .leftJoin(users, eq(schedules.agentId, users.id))
      .leftJoin(customers, eq(schedules.customerId, customers.id))
      .leftJoin(activityTypes, eq(schedules.activityTypeId, activityTypes.id))
      .where(
        and(
          eq(schedules.tenantId, tenantId),
          gte(schedules.startDateTime, startDate),
          lte(schedules.endDateTime, endDate)
        )
      )
      .orderBy(asc(schedules.startDateTime));
    
    return results.map(item => ({
      ...this.mapScheduleToEntity(item.schedule),
      agent: item.agent,
      customer: item.customer,
      activityType: item.activityType ? this.mapActivityTypeToEntity(item.activityType) : null,
    })) as any;
  }

  async getSchedulesByCustomer(customerId: string, tenantId: string): Promise<ScheduleEntity[]> {
    const results = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.customerId, customerId), eq(schedules.tenantId, tenantId)))
      .orderBy(desc(schedules.startDateTime));
    
    return results.map(this.mapScheduleToEntity);
  }

  async updateSchedule(id: string, tenantId: string, updates: Partial<ScheduleEntity>): Promise<ScheduleEntity> {
    const updateData: any = { ...updates };
    
    if (updates.coordinates) {
      updateData.coordinates = JSON.stringify(updates.coordinates);
    }
    if (updates.recurringPattern) {
      updateData.recurringPattern = JSON.stringify(updates.recurringPattern);
    }
    
    const [schedule] = await db
      .update(schedules)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)))
      .returning();
    
    return this.mapScheduleToEntity(schedule);
  }

  async deleteSchedule(id: string, tenantId: string): Promise<void> {
    await db
      .delete(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)));
  }

  // Activity Types CRUD
  async createActivityType(activityTypeData: Omit<ActivityTypeEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityTypeEntity> {
    const [activityType] = await db
      .insert(activityTypes)
      .values(activityTypeData)
      .returning();
    
    return this.mapActivityTypeToEntity(activityType);
  }

  async getActivityTypes(tenantId: string): Promise<ActivityTypeEntity[]> {
    const results = await db
      .select()
      .from(activityTypes)
      .where(and(eq(activityTypes.tenantId, tenantId), eq(activityTypes.isActive, true)))
      .orderBy(asc(activityTypes.name));
    
    return results.map(this.mapActivityTypeToEntity);
  }

  async getActivityTypeById(id: string, tenantId: string): Promise<ActivityTypeEntity | null> {
    const [activityType] = await db
      .select()
      .from(activityTypes)
      .where(and(eq(activityTypes.id, id), eq(activityTypes.tenantId, tenantId)));
    
    return activityType ? this.mapActivityTypeToEntity(activityType) : null;
  }

  async updateActivityType(id: string, tenantId: string, updates: Partial<ActivityTypeEntity>): Promise<ActivityTypeEntity> {
    const [activityType] = await db
      .update(activityTypes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(activityTypes.id, id), eq(activityTypes.tenantId, tenantId)))
      .returning();
    
    return this.mapActivityTypeToEntity(activityType);
  }

  async deleteActivityType(id: string, tenantId: string): Promise<void> {
    await db
      .delete(activityTypes)
      .where(and(eq(activityTypes.id, id), eq(activityTypes.tenantId, tenantId)));
  }

  // Agent Availability CRUD
  async createAgentAvailability(availabilityData: Omit<AgentAvailabilityEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentAvailabilityEntity> {
    const insertData = {
      ...availabilityData,
      preferredZones: availabilityData.preferredZones ? JSON.stringify(availabilityData.preferredZones) : null,
    };
    
    const [availability] = await db
      .insert(agentAvailability)
      .values(insertData)
      .returning();
    
    return this.mapAgentAvailabilityToEntity(availability);
  }

  async getAgentAvailability(agentId: string, tenantId: string): Promise<AgentAvailabilityEntity[]> {
    const results = await db
      .select()
      .from(agentAvailability)
      .where(and(eq(agentAvailability.agentId, agentId), eq(agentAvailability.tenantId, tenantId)))
      .orderBy(asc(agentAvailability.dayOfWeek));
    
    return results.map(this.mapAgentAvailabilityToEntity);
  }

  async getAgentAvailabilityByDay(agentId: string, tenantId: string, dayOfWeek: number): Promise<AgentAvailabilityEntity | null> {
    const [availability] = await db
      .select()
      .from(agentAvailability)
      .where(
        and(
          eq(agentAvailability.agentId, agentId),
          eq(agentAvailability.tenantId, tenantId),
          eq(agentAvailability.dayOfWeek, dayOfWeek)
        )
      );
    
    return availability ? this.mapAgentAvailabilityToEntity(availability) : null;
  }

  async updateAgentAvailability(id: string, tenantId: string, updates: Partial<AgentAvailabilityEntity>): Promise<AgentAvailabilityEntity> {
    const updateData: any = { ...updates };
    if (updates.preferredZones) {
      updateData.preferredZones = JSON.stringify(updates.preferredZones);
    }
    
    const [availability] = await db
      .update(agentAvailability)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(agentAvailability.id, id), eq(agentAvailability.tenantId, tenantId)))
      .returning();
    
    return this.mapAgentAvailabilityToEntity(availability);
  }

  async deleteAgentAvailability(id: string, tenantId: string): Promise<void> {
    await db
      .delete(agentAvailability)
      .where(and(eq(agentAvailability.id, id), eq(agentAvailability.tenantId, tenantId)));
  }

  // Conflict Detection and Management
  async detectConflicts(scheduleData: Partial<ScheduleEntity>, tenantId: string): Promise<ScheduleConflictEntity[]> {
    // Check for time overlaps with same agent
    const timeOverlaps = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.tenantId, tenantId),
          eq(schedules.agentId, scheduleData.agentId!),
          // Time overlap logic: start < other_end AND end > other_start
          sql`${schedules.startDateTime} < ${scheduleData.endDateTime} AND ${schedules.endDateTime} > ${scheduleData.startDateTime}`,
          // Exclude the current schedule if updating
          scheduleData.id ? sql`${schedules.id} != ${scheduleData.id}` : sql`true`
        )
      );
    
    // Convert to conflict entities
    const conflicts: ScheduleConflictEntity[] = timeOverlaps.map(overlap => ({
      id: '', // Will be generated when created
      tenantId,
      scheduleId: scheduleData.id || '',
      conflictWithScheduleId: overlap.id,
      conflictType: 'time_overlap' as const,
      conflictDetails: { overlapMinutes: this.calculateOverlapMinutes(scheduleData, overlap) },
      severity: 'high' as const,
      isResolved: false,
      createdAt: new Date(),
    }));
    
    return conflicts;
  }

  async createConflict(conflictData: Omit<ScheduleConflictEntity, 'id' | 'createdAt'>): Promise<ScheduleConflictEntity> {
    const [conflict] = await db
      .insert(scheduleConflicts)
      .values({
        ...conflictData,
        conflictDetails: conflictData.conflictDetails ? JSON.stringify(conflictData.conflictDetails) : null,
      })
      .returning();
    
    return this.mapConflictToEntity(conflict);
  }

  async getConflictsBySchedule(scheduleId: string, tenantId: string): Promise<ScheduleConflictEntity[]> {
    const results = await db
      .select()
      .from(scheduleConflicts)
      .where(and(eq(scheduleConflicts.scheduleId, scheduleId), eq(scheduleConflicts.tenantId, tenantId)))
      .orderBy(desc(scheduleConflicts.createdAt));
    
    return results.map(this.mapConflictToEntity);
  }

  async resolveConflict(conflictId: string, tenantId: string, resolutionNotes: string): Promise<void> {
    await db
      .update(scheduleConflicts)
      .set({
        isResolved: true,
        resolutionNotes,
        resolvedAt: new Date(),
      })
      .where(and(eq(scheduleConflicts.id, conflictId), eq(scheduleConflicts.tenantId, tenantId)));
  }

  // Dashboard and Analytics
  async getAgentScheduleStats(agentId: string, tenantId: string, startDate: Date, endDate: Date): Promise<{
    totalSchedules: number;
    totalHours: number;
    completedSchedules: number;
    cancelledSchedules: number;
    averageScheduleDuration: number;
  }> {
    const stats = await db
      .select({
        totalSchedules: sql<number>`count(*)`,
        totalHours: sql<number>`sum(${schedules.duration}) / 60.0`,
        completedSchedules: sql<number>`count(*) filter (where ${schedules.status} = 'completed')`,
        cancelledSchedules: sql<number>`count(*) filter (where ${schedules.status} = 'cancelled')`,
        averageScheduleDuration: sql<number>`avg(${schedules.duration})`,
      })
      .from(schedules)
      .where(
        and(
          eq(schedules.agentId, agentId),
          eq(schedules.tenantId, tenantId),
          gte(schedules.startDateTime, startDate),
          lte(schedules.endDateTime, endDate)
        )
      );
    
    return stats[0] || {
      totalSchedules: 0,
      totalHours: 0,
      completedSchedules: 0,
      cancelledSchedules: 0,
      averageScheduleDuration: 0,
    };
  }

  async getTeamScheduleOverview(tenantId: string, startDate: Date, endDate: Date): Promise<{
    totalAgents: number;
    totalSchedules: number;
    utilizationRate: number;
    conflictsCount: number;
  }> {
    const overview = await db
      .select({
        totalAgents: sql<number>`count(distinct ${schedules.agentId})`,
        totalSchedules: sql<number>`count(*)`,
        totalMinutes: sql<number>`sum(${schedules.duration})`,
        conflictsCount: sql<number>`count(distinct ${scheduleConflicts.id})`,
      })
      .from(schedules)
      .leftJoin(scheduleConflicts, eq(schedules.id, scheduleConflicts.scheduleId))
      .where(
        and(
          eq(schedules.tenantId, tenantId),
          gte(schedules.startDateTime, startDate),
          lte(schedules.endDateTime, endDate)
        )
      );
    
    const result = overview[0];
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPossibleMinutes = result.totalAgents * daysDiff * 8 * 60; // 8 hours per day
    const utilizationRate = totalPossibleMinutes > 0 ? (result.totalMinutes / totalPossibleMinutes) * 100 : 0;
    
    return {
      totalAgents: result.totalAgents || 0,
      totalSchedules: result.totalSchedules || 0,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      conflictsCount: result.conflictsCount || 0,
    };
  }

  async searchSchedules(tenantId: string, filters: {
    agentIds?: string[];
    customerIds?: string[];
    activityTypeIds?: string[];
    statuses?: string[];
    priorities?: string[];
    startDate?: Date;
    endDate?: Date;
    searchText?: string;
  }): Promise<ScheduleEntity[]> {
    const conditions = [eq(schedules.tenantId, tenantId)];
    
    if (filters.agentIds?.length) {
      conditions.push(inArray(schedules.agentId, filters.agentIds));
    }
    if (filters.customerIds?.length) {
      conditions.push(inArray(schedules.customerId, filters.customerIds));
    }
    if (filters.activityTypeIds?.length) {
      conditions.push(inArray(schedules.activityTypeId, filters.activityTypeIds));
    }
    if (filters.statuses?.length) {
      conditions.push(inArray(schedules.status, filters.statuses));
    }
    if (filters.priorities?.length) {
      conditions.push(inArray(schedules.priority, filters.priorities));
    }
    if (filters.startDate) {
      conditions.push(gte(schedules.startDateTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(schedules.endDateTime, filters.endDate));
    }
    if (filters.searchText) {
      conditions.push(
        sql`(${schedules.title} ilike ${`%${filters.searchText}%`} or ${schedules.description} ilike ${`%${filters.searchText}%`})`
      );
    }
    
    const results = await db
      .select()
      .from(schedules)
      .where(and(...conditions))
      .orderBy(asc(schedules.startDateTime));
    
    return results.map(this.mapScheduleToEntity);
  }

  async createRecurringSchedules(
    baseSchedule: Omit<ScheduleEntity, 'id' | 'createdAt' | 'updatedAt'>,
    recurrenceEnd: Date
  ): Promise<ScheduleEntity[]> {
    const pattern = baseSchedule.recurringPattern;
    if (!pattern) {
      throw new Error('Recurring pattern is required for recurring schedules');
    }
    
    const scheduleInstances: ScheduleEntity[] = [];
    let currentDate = new Date(baseSchedule.startDateTime);
    const endDate = new Date(recurrenceEnd);
    
    while (currentDate <= endDate) {
      const scheduleData = {
        ...baseSchedule,
        startDateTime: new Date(currentDate),
        endDateTime: new Date(currentDate.getTime() + baseSchedule.duration * 60000),
        isRecurring: true,
        parentScheduleId: baseSchedule.parentScheduleId,
      };
      
      const schedule = await this.createSchedule(scheduleData);
      scheduleInstances.push(schedule);
      
      // Increment date based on pattern
      switch (pattern.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * pattern.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          break;
      }
    }
    
    return scheduleInstances;
  }

  // Helper methods for mapping
  private mapScheduleToEntity(schedule: any): ScheduleEntity {
    return {
      ...schedule,
      coordinates: schedule.coordinates ? JSON.parse(schedule.coordinates) : undefined,
      recurringPattern: schedule.recurringPattern ? JSON.parse(schedule.recurringPattern) : undefined,
    };
  }

  private mapActivityTypeToEntity(activityType: any): ActivityTypeEntity {
    return activityType;
  }

  private mapAgentAvailabilityToEntity(availability: any): AgentAvailabilityEntity {
    return {
      ...availability,
      preferredZones: availability.preferredZones ? JSON.parse(availability.preferredZones) : undefined,
    };
  }

  private mapConflictToEntity(conflict: any): ScheduleConflictEntity {
    return {
      ...conflict,
      conflictDetails: conflict.conflictDetails ? JSON.parse(conflict.conflictDetails) : undefined,
    };
  }

  private calculateOverlapMinutes(schedule1: any, schedule2: any): number {
    const start1 = new Date(schedule1.startDateTime);
    const end1 = new Date(schedule1.endDateTime);
    const start2 = new Date(schedule2.startDateTime);
    const end2 = new Date(schedule2.endDateTime);
    
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
    
    return Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));
  }
}