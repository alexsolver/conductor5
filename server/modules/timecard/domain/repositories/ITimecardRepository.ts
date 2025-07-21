import { TimeRecord, CreateTimeRecordRequest, DailyTimesheet, HourBankEntry, WorkSchedule, TimeAlert } from '../entities/TimeRecord''[,;]

export interface ITimecardRepository {
  // Time Records
  createTimeRecord(tenantId: string, userId: string, data: CreateTimeRecordRequest): Promise<TimeRecord>;
  findTimeRecordsByUserId(userId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<TimeRecord[]>;
  findTimeRecordsByDate(tenantId: string, date: Date): Promise<TimeRecord[]>;
  updateTimeRecord(id: string, tenantId: string, data: Partial<TimeRecord>): Promise<TimeRecord>;
  deleteTimeRecord(id: string, tenantId: string): Promise<void>;
  
  // Daily Timesheet
  generateDailyTimesheet(userId: string, tenantId: string, date: Date): Promise<DailyTimesheet>;
  findTimesheetByUserAndDate(userId: string, tenantId: string, date: Date): Promise<DailyTimesheet | null>;
  findTimesheetsByUserId(userId: string, tenantId: string, startDate: Date, endDate: Date): Promise<DailyTimesheet[]>;
  updateTimesheet(id: string, tenantId: string, data: Partial<DailyTimesheet>): Promise<DailyTimesheet>;
  approveTimesheet(id: string, tenantId: string, approvedBy: string): Promise<DailyTimesheet>;
  signTimesheet(id: string, tenantId: string, signature: string): Promise<DailyTimesheet>;
  
  // Hour Bank
  createHourBankEntry(tenantId: string, data: Omit<HourBankEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<HourBankEntry>;
  findHourBankByUserId(userId: string, tenantId: string): Promise<HourBankEntry[]>;
  calculateHourBankBalance(userId: string, tenantId: string, date?: Date): Promise<number>;
  processHourBankExpiration(tenantId: string): Promise<void>;
  
  // Work Schedules
  createWorkSchedule(tenantId: string, data: Omit<WorkSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkSchedule>;
  findWorkScheduleById(id: string, tenantId: string): Promise<WorkSchedule | null>;
  findWorkSchedulesByTenant(tenantId: string): Promise<WorkSchedule[]>;
  updateWorkSchedule(id: string, tenantId: string, data: Partial<WorkSchedule>): Promise<WorkSchedule>;
  deleteWorkSchedule(id: string, tenantId: string): Promise<void>;
  
  // Alerts and Compliance
  createTimeAlert(tenantId: string, data: Omit<TimeAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeAlert>;
  findActiveAlerts(tenantId: string, userId?: string): Promise<TimeAlert[]>;
  resolveAlert(id: string, tenantId: string, resolvedBy: string, notes?: string): Promise<TimeAlert>;
  findAlertsByType(tenantId: string, alertType: string): Promise<TimeAlert[]>;
  
  // Compliance and Validation
  validateTimeRecords(userId: string, tenantId: string, date: Date): Promise<string[]>;
  detectInconsistencies(userId: string, tenantId: string, date: Date): Promise<string[]>;
  generateComplianceReport(tenantId: string, startDate: Date, endDate: Date): Promise<any>;
  
  // Analytics and Reports
  getUserWorkingHoursReport(userId: string, tenantId: string, startDate: Date, endDate: Date): Promise<any>;
  getTenantOvertimeReport(tenantId: string, startDate: Date, endDate: Date): Promise<any>;
  getAttendanceReport(tenantId: string, startDate: Date, endDate: Date): Promise<any>;
}