// Schedule Repository Interface - Application Layer
import { ScheduleEntity, ActivityTypeEntity, AgentAvailabilityEntity, ScheduleConflictEntity } from '../../domain/entities/Schedule';

export interface IScheduleRepository {
  // Schedule CRUD
  createSchedule(schedule: Omit<ScheduleEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleEntity>;
  getScheduleById(id: string, tenantId: string): Promise<ScheduleEntity | null>;
  getSchedulesByAgent(agentId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<ScheduleEntity[]>;
  getSchedulesByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<ScheduleEntity[]>;
  getSchedulesByCustomer(customerId: string, tenantId: string): Promise<ScheduleEntity[]>;
  updateSchedule(id: string, tenantId: string, updates: Partial<ScheduleEntity>): Promise<ScheduleEntity>;
  deleteSchedule(id: string, tenantId: string): Promise<void>;
  
  // Activity Types CRUD
  createActivityType(activityType: Omit<ActivityTypeEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityTypeEntity>;
  getActivityTypes(tenantId: string): Promise<ActivityTypeEntity[]>;
  getActivityTypeById(id: string, tenantId: string): Promise<ActivityTypeEntity | null>;
  updateActivityType(id: string, tenantId: string, updates: Partial<ActivityTypeEntity>): Promise<ActivityTypeEntity>;
  deleteActivityType(id: string, tenantId: string): Promise<void>;
  
  // Agent Availability CRUD
  createAgentAvailability(availability: Omit<AgentAvailabilityEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentAvailabilityEntity>;
  getAgentAvailability(agentId: string, tenantId: string): Promise<AgentAvailabilityEntity[]>;
  getAgentAvailabilityByDay(agentId: string, tenantId: string, dayOfWeek: number): Promise<AgentAvailabilityEntity | null>;
  updateAgentAvailability(id: string, tenantId: string, updates: Partial<AgentAvailabilityEntity>): Promise<AgentAvailabilityEntity>;
  deleteAgentAvailability(id: string, tenantId: string): Promise<void>;
  
  // Conflict Detection and Management
  detectConflicts(scheduleData: Partial<ScheduleEntity>, tenantId: string): Promise<ScheduleConflictEntity[]>;
  createConflict(conflict: Omit<ScheduleConflictEntity, 'id' | 'createdAt'>): Promise<ScheduleConflictEntity>;
  getConflictsBySchedule(scheduleId: string, tenantId: string): Promise<ScheduleConflictEntity[]>;
  resolveConflict(conflictId: string, tenantId: string, resolutionNotes: string): Promise<void>;
  
  // Dashboard and Analytics
  getAgentScheduleStats(agentId: string, tenantId: string, startDate: Date, endDate: Date): Promise<{
    totalSchedules: number;
    totalHours: number;
    completedSchedules: number;
    cancelledSchedules: number;
    averageScheduleDuration: number;
  }>;
  
  getTeamScheduleOverview(tenantId: string, startDate: Date, endDate: Date): Promise<{
    totalAgents: number;
    totalSchedules: number;
    utilizationRate: number;
    conflictsCount: number;
  }>;
  
  // Search and Filtering
  searchSchedules(tenantId: string, filters: {
    agentIds?: string[];
    customerIds?: string[];
    activityTypeIds?: string[];
    statuses?: string[];
    priorities?: string[];
    startDate?: Date;
    endDate?: Date;
    searchText?: string;
  }): Promise<ScheduleEntity[]>;
  
  // Recurring Schedules
  createRecurringSchedules(
    baseSchedule: Omit<ScheduleEntity, 'id' | 'createdAt' | 'updatedAt'>,
    recurrenceEnd: Date
  ): Promise<ScheduleEntity[]>;
}