/**
 * Timecard Repository Interface
 * Clean Architecture - Domain Layer
 * 
 * @module ITimecardRepository
 * @created 2025-08-12 - Phase 16 Clean Architecture Implementation
 */

import { TimecardEntry, WorkSchedule, HourBank, AbsenceRequest } from '../entities/TimecardEntry';

export interface ITimecardRepository {
  // Timecard Entries
  createTimecardEntry(entry: Omit<TimecardEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimecardEntry>;
  getTimecardEntryById(id: string, tenantId: string): Promise<TimecardEntry | null>;
  getTimecardEntriesByUser(userId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<TimecardEntry[]>;
  getTimecardEntriesByUserAndDate(userId: string, date: string, tenantId: string): Promise<TimecardEntry[]>;
  updateTimecardEntry(id: string, updates: Partial<TimecardEntry>, tenantId: string): Promise<TimecardEntry | null>;
  deleteTimecardEntry(id: string, tenantId: string): Promise<boolean>;

  // Work Schedules
  createWorkSchedule(schedule: Omit<WorkSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkSchedule>;
  getWorkScheduleById(id: string, tenantId: string): Promise<WorkSchedule | null>;
  getWorkSchedulesByUser(userId: string, tenantId: string): Promise<WorkSchedule[]>;
  getAllWorkSchedules(tenantId: string): Promise<WorkSchedule[]>;
  updateWorkSchedule(id: string, updates: Partial<WorkSchedule>, tenantId: string): Promise<WorkSchedule | null>;
  deleteWorkSchedule(id: string, tenantId: string): Promise<boolean>;

  // Hour Bank
  getHourBankByUser(userId: string, tenantId: string): Promise<HourBank[]>;
  getHourBankSummary(tenantId: string): Promise<any>;
  updateHourBank(userId: string, month: string, updates: Partial<HourBank>, tenantId: string): Promise<HourBank | null>;

  // Absence Requests
  createAbsenceRequest(request: Omit<AbsenceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<AbsenceRequest>;
  getAbsenceRequestById(id: string, tenantId: string): Promise<AbsenceRequest | null>;
  getPendingAbsenceRequests(tenantId: string): Promise<AbsenceRequest[]>;
  updateAbsenceRequest(id: string, updates: Partial<AbsenceRequest>, tenantId: string): Promise<AbsenceRequest | null>;

  // Reports
  getAttendanceReport(tenantId: string, startDate: Date, endDate: Date): Promise<any>;
  getOvertimeReport(tenantId: string, startDate: Date, endDate: Date): Promise<any>;
  getComplianceReport(tenantId: string, startDate: Date, endDate: Date): Promise<any>;

  // Users (for dropdown support)
  getUsers(tenantId: string): Promise<any[]>;

  // Schedule Templates
  getScheduleTemplates(tenantId: string): Promise<any[]>;
  createScheduleTemplate(template: any): Promise<any>;
  updateScheduleTemplate(id: string, updates: any, tenantId: string): Promise<any>;
  deleteScheduleTemplate(id: string, tenantId: string): Promise<boolean>;
}