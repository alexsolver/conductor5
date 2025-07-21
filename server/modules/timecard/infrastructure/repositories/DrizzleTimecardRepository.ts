import { 
  timeRecords, 
  dailyTimesheet, 
  hourBank, 
  workSchedules, 
  timeAlerts,
  auditLogs,
  absenceRequests,
  scheduleTemplates,
  shiftSwapRequests,
  flexibleWorkArrangements,
  scheduleNotifications
} from '@shared/schema/timecard';
import { 
  TimeRecord, 
  CreateTimeRecordRequest, 
  DailyTimesheet, 
  HourBankEntry, 
  WorkSchedule, 
  TimeAlert 
} from '../../domain/entities/TimeRecord';
import { ITimecardRepository } from '../../domain/repositories/ITimecardRepository';
import { sql, eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { db } from '../../../../db';
import crypto from 'crypto';

export class DrizzleTimecardRepository implements ITimecardRepository {
  
  // Time Records
  async createTimeRecord(tenantId: string, userId: string, data: CreateTimeRecordRequest): Promise<TimeRecord> {
    const biometricHash = data.biometricData ? 
      crypto.createHash('sha256').update(data.biometricData).digest('hex') : 
      undefined;

    const recordData = {
      tenantId,
      userId,
      recordDateTime: new Date(),
      recordType: data.recordType,
      deviceType: data.deviceType,
      location: data.location,
      notes: data.notes,
      biometricHash,
      isOfflineRecord: data.isOfflineRecord || false,
      originalDeviceId: data.originalDeviceId,
      isAdjusted: false,
    };

    const [record] = await db.insert(timeRecords).values(recordData).returning();
    
    // Criar log de auditoria
    await this.createAuditLog(tenantId, 'time_record', record.id, 'create', userId, null, recordData);
    
    // Verificar inconsistências após inserção
    await this.validateAndCreateAlerts(userId, tenantId, new Date());
    
    return record as TimeRecord;
  }

  async findTimeRecordsByUserId(userId: string, tenantId: string, startDate?: Date, endDate?: Date): Promise<TimeRecord[]> {
    let query = db.select()
      .from(timeRecords)
      .where(and(
        eq(timeRecords.tenantId, tenantId),
        eq(timeRecords.userId, userId)
      ));

    if (startDate && endDate) {
      const records = await db.select()
        .from(timeRecords)
        .where(and(
          eq(timeRecords.tenantId, tenantId),
          eq(timeRecords.userId, userId),
          gte(timeRecords.recordDateTime, startDate),
          lte(timeRecords.recordDateTime, endDate)
        ))
        .orderBy(desc(timeRecords.recordDateTime));
      return records as TimeRecord[];
    }

    const records = await query.orderBy(desc(timeRecords.recordDateTime));
    return records as TimeRecord[];
  }

  async findTimeRecordsByDate(tenantId: string, date: Date): Promise<TimeRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await db.select()
      .from(timeRecords)
      .where(and(
        eq(timeRecords.tenantId, tenantId),
        gte(timeRecords.recordDateTime, startOfDay),
        lte(timeRecords.recordDateTime, endOfDay)
      ))
      .orderBy(asc(timeRecords.recordDateTime));

    return records as TimeRecord[];
  }

  async updateTimeRecord(id: string, tenantId: string, data: Partial<TimeRecord>): Promise<TimeRecord> {
    const oldRecord = await db.select()
      .from(timeRecords)
      .where(and(eq(timeRecords.id, id), eq(timeRecords.tenantId, tenantId)))
      .limit(1);

    if (oldRecord.length === 0) {
      throw new Error('Registro de ponto não encontrado');
    }

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const [updatedRecord] = await db
      .update(timeRecords)
      .set(updateData)
      .where(and(eq(timeRecords.id, id), eq(timeRecords.tenantId, tenantId)))
      .returning();

    // Criar log de auditoria
    await this.createAuditLog(tenantId, 'time_record', id, 'update', data.adjustedBy || '', oldRecord[0], updateData);

    return updatedRecord as TimeRecord;
  }

  async deleteTimeRecord(id: string, tenantId: string): Promise<void> {
    const oldRecord = await db.select()
      .from(timeRecords)
      .where(and(eq(timeRecords.id, id), eq(timeRecords.tenantId, tenantId)))
      .limit(1);

    await db.delete(timeRecords)
      .where(and(eq(timeRecords.id, id), eq(timeRecords.tenantId, tenantId)));

    if (oldRecord.length > 0) {
      // Criar log de auditoria
      await this.createAuditLog(tenantId, 'time_record', id, 'delete', '', oldRecord[0], null);
    }
  }

  // Daily Timesheet
  async generateDailyTimesheet(userId: string, tenantId: string, date: Date): Promise<DailyTimesheet> {
    const records = await this.findTimeRecordsByDate(tenantId, date);
    const userRecords = records.filter(r => r.userId === userId);

    // Organizar registros por tipo
    const clockIn = userRecords.find(r => r.recordType === 'clock_in');
    const clockOut = userRecords.find(r => r.recordType === 'clock_out');
    const breakStart = userRecords.find(r => r.recordType === 'break_start');
    const breakEnd = userRecords.find(r => r.recordType === 'break_end');

    // Calcular horas trabalhadas
    const calculations = this.calculateWorkingHours(clockIn, clockOut, breakStart, breakEnd);
    
    // Detectar inconsistências
    const inconsistencies = await this.detectInconsistencies(userId, tenantId, date);

    const timesheetData = {
      tenantId,
      userId,
      workDate: date,
      clockIn: clockIn?.recordDateTime,
      clockOut: clockOut?.recordDateTime,
      breakStart: breakStart?.recordDateTime,
      breakEnd: breakEnd?.recordDateTime,
      totalWorkedHours: calculations.totalWorkedHours.toString(),
      regularHours: calculations.regularHours.toString(),
      overtimeHours: calculations.overtimeHours.toString(),
      nightShiftHours: calculations.nightShiftHours.toString(),
      breakMinutes: calculations.breakMinutes,
      hasInconsistencies: inconsistencies.length > 0,
      inconsistencyReasons: inconsistencies,
      status: inconsistencies.length > 0 ? 'inconsistent' : 'pending' as const,
      requiresApproval: inconsistencies.length > 0 || calculations.overtimeHours > 2,
      isApproved: false,
    };

    const [timesheet] = await db.insert(dailyTimesheet).values(timesheetData).returning();
    return timesheet as DailyTimesheet;
  }

  async findTimesheetByUserAndDate(userId: string, tenantId: string, date: Date): Promise<DailyTimesheet | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [timesheet] = await db.select()
      .from(dailyTimesheet)
      .where(and(
        eq(dailyTimesheet.tenantId, tenantId),
        eq(dailyTimesheet.userId, userId),
        gte(dailyTimesheet.workDate, startOfDay),
        lte(dailyTimesheet.workDate, endOfDay)
      ))
      .limit(1);

    return timesheet as DailyTimesheet || null;
  }

  async findTimesheetsByUserId(userId: string, tenantId: string, startDate: Date, endDate: Date): Promise<DailyTimesheet[]> {
    const timesheets = await db.select()
      .from(dailyTimesheet)
      .where(and(
        eq(dailyTimesheet.tenantId, tenantId),
        eq(dailyTimesheet.userId, userId),
        gte(dailyTimesheet.workDate, startDate),
        lte(dailyTimesheet.workDate, endDate)
      ))
      .orderBy(desc(dailyTimesheet.workDate));

    return timesheets as DailyTimesheet[];
  }

  async updateTimesheet(id: string, tenantId: string, data: Partial<DailyTimesheet>): Promise<DailyTimesheet> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(dailyTimesheet)
      .set(updateData)
      .where(and(eq(dailyTimesheet.id, id), eq(dailyTimesheet.tenantId, tenantId)))
      .returning();

    return updated as DailyTimesheet;
  }

  async approveTimesheet(id: string, tenantId: string, approvedBy: string): Promise<DailyTimesheet> {
    const approvalData = {
      isApproved: true,
      approvedBy,
      approvedAt: new Date(),
      status: 'approved' as const,
      updatedAt: new Date(),
    };

    const [approved] = await db
      .update(dailyTimesheet)
      .set(approvalData)
      .where(and(eq(dailyTimesheet.id, id), eq(dailyTimesheet.tenantId, tenantId)))
      .returning();

    // Criar log de auditoria
    await this.createAuditLog(tenantId, 'timesheet', id, 'approve', approvedBy, null, approvalData);

    return approved as DailyTimesheet;
  }

  async signTimesheet(id: string, tenantId: string, signature: string): Promise<DailyTimesheet> {
    const signData = {
      digitalSignature: signature,
      signedAt: new Date(),
      updatedAt: new Date(),
    };

    const [signed] = await db
      .update(dailyTimesheet)
      .set(signData)
      .where(and(eq(dailyTimesheet.id, id), eq(dailyTimesheet.tenantId, tenantId)))
      .returning();

    return signed as DailyTimesheet;
  }

  // Hour Bank
  async createHourBankEntry(tenantId: string, data: Omit<HourBankEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<HourBankEntry> {
    const entryData = {
      tenantId,
      userId: data.userId,
      referenceDate: data.referenceDate,
      balanceHours: data.balanceHours.toString(),
      accumulatedHours: data.accumulatedHours.toString(),
      usedHours: data.usedHours.toString(),
      expiredHours: data.expiredHours.toString(),
      expirationPolicy: data.expirationPolicy,
      expirationDate: data.expirationDate,
      movementType: data.movementType,
      description: data.description,
      relatedTimesheetId: data.relatedTimesheetId,
    };

    const [entry] = await db.insert(hourBank).values(entryData).returning();
    return entry as HourBankEntry;
  }

  async findHourBankByUserId(userId: string, tenantId: string): Promise<HourBankEntry[]> {
    const entries = await db.select()
      .from(hourBank)
      .where(and(
        eq(hourBank.tenantId, tenantId),
        eq(hourBank.userId, userId)
      ))
      .orderBy(desc(hourBank.referenceDate));

    return entries as HourBankEntry[];
  }

  async calculateHourBankBalance(userId: string, tenantId: string, date?: Date): Promise<number> {
    let whereConditions = and(
      eq(hourBank.tenantId, tenantId),
      eq(hourBank.userId, userId)
    );

    if (date) {
      whereConditions = and(
        eq(hourBank.tenantId, tenantId),
        eq(hourBank.userId, userId),
        lte(hourBank.referenceDate, date)
      );
    }

    const entries = await db.select({ balance: hourBank.balanceHours })
      .from(hourBank)
      .where(whereConditions);

    return entries.reduce((total, entry) => total + Number(entry.balance), 0);
  }

  async processHourBankExpiration(tenantId: string): Promise<void> {
    const today = new Date();
    const expiredEntries = await db.select()
      .from(hourBank)
      .where(and(
        eq(hourBank.tenantId, tenantId),
        lte(hourBank.expirationDate, today),
        sql`${hourBank.balanceHours} > 0`
      ));

    for (const entry of expiredEntries) {
      // Criar entrada de expiração
      await this.createHourBankEntry(tenantId, {
        tenantId,
        userId: entry.userId,
        referenceDate: today,
        balanceHours: (-Number(entry.balanceHours)).toString(),
        accumulatedHours: "0",
        usedHours: "0",
        expiredHours: entry.balanceHours,
        expirationPolicy: entry.expirationPolicy as any,
        movementType: 'expiration',
        description: `Expiração automática de ${entry.balanceHours} horas`,
        relatedTimesheetId: entry.relatedTimesheetId || undefined,
      });
    }
  }

  // Work Schedules
  async createWorkSchedule(tenantId: string, data: Omit<WorkSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkSchedule> {
    const scheduleData = {
      tenantId,
      name: data.name,
      code: data.code,
      scheduleType: data.scheduleType,
      workDaysPerWeek: data.workDaysPerWeek,
      hoursPerDay: data.hoursPerDay.toString(),
      hoursPerWeek: data.hoursPerWeek.toString(),
      standardStart: data.standardStart,
      standardEnd: data.standardEnd,
      breakDuration: data.breakDuration,
      lunchDuration: data.lunchDuration,
      allowsFlexTime: data.allowsFlexTime,
      flexTimeToleranceMinutes: data.flexTimeToleranceMinutes,
      nightShiftStart: data.nightShiftStart,
      nightShiftEnd: data.nightShiftEnd,
      allowsHourBank: data.allowsHourBank,
      hourBankLimit: data.hourBankLimit?.toString(),
      overtimeMultiplier: data.overtimeMultiplier.toString(),
      configuration: data.configuration,
      isActive: data.isActive,
    };

    const [schedule] = await db.insert(workSchedules).values(scheduleData).returning();
    return schedule as WorkSchedule;
  }

  async findWorkScheduleById(id: string, tenantId: string): Promise<WorkSchedule | null> {
    const [schedule] = await db.select()
      .from(workSchedules)
      .where(and(eq(workSchedules.id, id), eq(workSchedules.tenantId, tenantId)))
      .limit(1);

    return schedule as WorkSchedule || null;
  }

  async findWorkSchedulesByTenant(tenantId: string): Promise<WorkSchedule[]> {
    const schedules = await db.select()
      .from(workSchedules)
      .where(eq(workSchedules.tenantId, tenantId))
      .orderBy(asc(workSchedules.name));

    return schedules as WorkSchedule[];
  }

  async updateWorkSchedule(id: string, tenantId: string, data: Partial<WorkSchedule>): Promise<WorkSchedule> {
    const updateData: any = { updatedAt: new Date() };
    
    if (data.hoursPerDay !== undefined) updateData.hoursPerDay = data.hoursPerDay.toString();
    if (data.hoursPerWeek !== undefined) updateData.hoursPerWeek = data.hoursPerWeek.toString();
    if (data.hourBankLimit !== undefined) updateData.hourBankLimit = data.hourBankLimit?.toString();
    if (data.overtimeMultiplier !== undefined) updateData.overtimeMultiplier = data.overtimeMultiplier.toString();
    
    // Copy other fields directly
    Object.keys(data).forEach(key => {
      if (!['hoursPerDay', 'hoursPerWeek', 'hourBankLimit', 'overtimeMultiplier'].includes(key)) {
        updateData[key] = (data as any)[key];
      }
    });

    const [updated] = await db
      .update(workSchedules)
      .set(updateData)
      .where(and(eq(workSchedules.id, id), eq(workSchedules.tenantId, tenantId)))
      .returning();

    return updated as WorkSchedule;
  }

  async deleteWorkSchedule(id: string, tenantId: string): Promise<void> {
    await db.delete(workSchedules)
      .where(and(eq(workSchedules.id, id), eq(workSchedules.tenantId, tenantId)));
  }

  // Alerts and Compliance
  async createTimeAlert(tenantId: string, data: Omit<TimeAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeAlert> {
    const [alert] = await db.insert(timeAlerts).values({
      ...data,
      tenantId,
    }).returning();

    return alert as TimeAlert;
  }

  async findActiveAlerts(tenantId: string, userId?: string): Promise<TimeAlert[]> {
    let whereConditions = and(
      eq(timeAlerts.tenantId, tenantId),
      eq(timeAlerts.status, 'active')
    );

    if (userId) {
      whereConditions = and(
        eq(timeAlerts.tenantId, tenantId),
        eq(timeAlerts.status, 'active'),
        eq(timeAlerts.userId, userId)
      );
    }

    const alerts = await db.select()
      .from(timeAlerts)
      .where(whereConditions)
      .orderBy(desc(timeAlerts.createdAt));
      
    return alerts as TimeAlert[];
  }

  async resolveAlert(id: string, tenantId: string, resolvedBy: string, notes?: string): Promise<TimeAlert> {
    const [resolved] = await db
      .update(timeAlerts)
      .set({
        status: 'resolved',
        resolvedBy,
        resolvedAt: new Date(),
        resolutionNotes: notes,
        updatedAt: new Date(),
      })
      .where(and(eq(timeAlerts.id, id), eq(timeAlerts.tenantId, tenantId)))
      .returning();

    return resolved as TimeAlert;
  }

  async findAlertsByType(tenantId: string, alertType: string): Promise<TimeAlert[]> {
    const alerts = await db.select()
      .from(timeAlerts)
      .where(and(
        eq(timeAlerts.tenantId, tenantId),
        eq(timeAlerts.alertType, alertType)
      ))
      .orderBy(desc(timeAlerts.createdAt));

    return alerts as TimeAlert[];
  }

  // Compliance and Validation
  async validateTimeRecords(userId: string, tenantId: string, date: Date): Promise<string[]> {
    const records = await this.findTimeRecordsByDate(tenantId, date);
    const userRecords = records.filter(r => r.userId === userId);
    const violations: string[] = [];

    // Verificar registros obrigatórios
    const hasClockIn = userRecords.some(r => r.recordType === 'clock_in');
    const hasClockOut = userRecords.some(r => r.recordType === 'clock_out');

    if (!hasClockIn) violations.push('Ausência de marcação de entrada');
    if (!hasClockOut) violations.push('Ausência de marcação de saída');

    // Verificar duplicatas
    const recordTypes = userRecords.map(r => r.recordType);
    const duplicates = recordTypes.filter((type, index) => recordTypes.indexOf(type) !== index);
    if (duplicates.length > 0) {
      violations.push(`Marcações duplicadas: ${duplicates.join(', ')}`);
    }

    // Verificar jornada excessiva (mais de 10 horas)
    if (hasClockIn && hasClockOut) {
      const clockIn = userRecords.find(r => r.recordType === 'clock_in');
      const clockOut = userRecords.find(r => r.recordType === 'clock_out');
      if (clockIn && clockOut) {
        const workingHours = (clockOut.recordDateTime.getTime() - clockIn.recordDateTime.getTime()) / (1000 * 60 * 60);
        if (workingHours > 10) {
          violations.push(`Jornada excessiva: ${workingHours.toFixed(2)} horas`);
        }
      }
    }

    return violations;
  }

  async detectInconsistencies(userId: string, tenantId: string, date: Date): Promise<string[]> {
    return await this.validateTimeRecords(userId, tenantId, date);
  }

  async generateComplianceReport(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    const timesheets = await db.select()
      .from(dailyTimesheet)
      .where(and(
        eq(dailyTimesheet.tenantId, tenantId),
        gte(dailyTimesheet.workDate, startDate),
        lte(dailyTimesheet.workDate, endDate)
      ));

    const alerts = await db.select()
      .from(timeAlerts)
      .where(and(
        eq(timeAlerts.tenantId, tenantId),
        gte(timeAlerts.createdAt, startDate),
        lte(timeAlerts.createdAt, endDate)
      ));

    return {
      period: { startDate, endDate },
      totalTimesheets: timesheets.length,
      inconsistentTimesheets: timesheets.filter(t => t.hasInconsistencies).length,
      unapprovedTimesheets: timesheets.filter(t => !t.isApproved).length,
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      alertsByType: alerts.reduce((acc, alert) => {
        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Analytics and Reports
  async getUserWorkingHoursReport(userId: string, tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    const timesheets = await this.findTimesheetsByUserId(userId, tenantId, startDate, endDate);

    const totalHours = timesheets.reduce((sum, t) => sum + Number(t.totalWorkedHours || '0'), 0);
    const overtimeHours = timesheets.reduce((sum, t) => sum + Number(t.overtimeHours || '0'), 0);
    const nightShiftHours = timesheets.reduce((sum, t) => sum + Number(t.nightShiftHours || '0'), 0);

    return {
      userId,
      period: { startDate, endDate },
      totalWorkingDays: timesheets.length,
      totalHours,
      regularHours: totalHours - overtimeHours,
      overtimeHours,
      nightShiftHours,
      averageHoursPerDay: timesheets.length > 0 ? totalHours / timesheets.length : 0,
      inconsistentDays: timesheets.filter(t => t.hasInconsistencies).length,
    };
  }

  async getTenantOvertimeReport(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    const timesheets = await db.select()
      .from(dailyTimesheet)
      .where(and(
        eq(dailyTimesheet.tenantId, tenantId),
        gte(dailyTimesheet.workDate, startDate),
        lte(dailyTimesheet.workDate, endDate),
        sql`${dailyTimesheet.overtimeHours} > 0`
      ));

    const totalOvertime = timesheets.reduce((sum, t) => sum + Number(t.overtimeHours || '0'), 0);
    const userOvertimeMap = timesheets.reduce((acc, t) => {
      acc[t.userId] = (acc[t.userId] || 0) + Number(t.overtimeHours || '0');
      return acc;
    }, {} as Record<string, number>);

    return {
      period: { startDate, endDate },
      totalOvertimeHours: totalOvertime,
      usersWithOvertime: Object.keys(userOvertimeMap).length,
      overtimeByUser: userOvertimeMap,
      averageOvertimePerDay: timesheets.length > 0 ? totalOvertime / timesheets.length : 0,
    };
  }

  async getAttendanceReport(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    const timesheets = await db.select()
      .from(dailyTimesheet)
      .where(and(
        eq(dailyTimesheet.tenantId, tenantId),
        gte(dailyTimesheet.workDate, startDate),
        lte(dailyTimesheet.workDate, endDate)
      ));

    const alerts = await db.select()
      .from(timeAlerts)
      .where(and(
        eq(timeAlerts.tenantId, tenantId),
        gte(timeAlerts.relatedDate, startDate),
        lte(timeAlerts.relatedDate, endDate)
      ));

    return {
      period: { startDate, endDate },
      totalWorkingDays: timesheets.length,
      attendanceRate: timesheets.filter(t => t.clockIn && t.clockOut).length / timesheets.length * 100,
      punctualityRate: alerts.filter(a => a.alertType === 'missing_record').length / timesheets.length * 100,
      inconsistencyRate: timesheets.filter(t => t.hasInconsistencies).length / timesheets.length * 100,
      approvalPendingCount: timesheets.filter(t => t.requiresApproval && !t.isApproved).length,
    };
  }

  // Helper methods
  private calculateWorkingHours(clockIn?: TimeRecord, clockOut?: TimeRecord, breakStart?: TimeRecord, breakEnd?: TimeRecord) {
    if (!clockIn || !clockOut) {
      return {
        totalWorkedHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        nightShiftHours: 0,
        breakMinutes: 0,
      };
    }

    const workStart = clockIn.recordDateTime;
    const workEnd = clockOut.recordDateTime;
    
    let totalMinutes = (workEnd.getTime() - workStart.getTime()) / (1000 * 60);
    let breakMinutes = 0;

    // Subtrair tempo de pausa
    if (breakStart && breakEnd) {
      breakMinutes = (breakEnd.recordDateTime.getTime() - breakStart.recordDateTime.getTime()) / (1000 * 60);
      totalMinutes -= breakMinutes;
    }

    const totalHours = totalMinutes / 60;
    const regularHours = Math.min(totalHours, 8); // 8 horas regulares
    const overtimeHours = Math.max(0, totalHours - 8);

    // Calcular horas noturnas (22h às 5h)
    const nightShiftHours = this.calculateNightShiftHours(workStart, workEnd);

    return {
      totalWorkedHours: Number(totalHours.toFixed(2)),
      regularHours: Number(regularHours.toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
      nightShiftHours: Number(nightShiftHours.toFixed(2)),
      breakMinutes: Math.round(breakMinutes),
    };
  }

  private calculateNightShiftHours(start: Date, end: Date): number {
    // Implementar cálculo de adicional noturno (22h às 5h)
    let nightHours = 0;
    
    const current = new Date(start);
    while (current < end) {
      const hour = current.getHours();
      if (hour >= 22 || hour < 5) {
        nightHours += 1/60; // 1 minuto
      }
      current.setMinutes(current.getMinutes() + 1);
    }
    
    return nightHours;
  }

  private async validateAndCreateAlerts(userId: string, tenantId: string, date: Date): Promise<void> {
    const violations = await this.validateTimeRecords(userId, tenantId, date);
    
    for (const violation of violations) {
      await this.createTimeAlert(tenantId, {
        tenantId,
        userId,
        alertType: this.mapViolationToAlertType(violation),
        severity: this.mapViolationToSeverity(violation),
        title: violation,
        description: `Inconsistência detectada no registro de ponto do dia ${date.toLocaleDateString('pt-BR')}`,
        relatedDate: date,
        status: 'active',
        notifiedHR: violation.includes('excessiva'),
      });
    }
  }

  private mapViolationToAlertType(violation: string): 'missing_record' | 'duplicate_record' | 'overtime_exceeded' | 'incomplete_shift' | 'hour_bank_limit' | 'legal_violation' {
    if (violation.includes('Ausência')) return 'missing_record';
    if (violation.includes('duplicadas')) return 'duplicate_record';
    if (violation.includes('excessiva')) return 'overtime_exceeded';
    return 'legal_violation';
  }

  private mapViolationToSeverity(violation: string): 'low' | 'medium' | 'high' | 'critical' {
    if (violation.includes('excessiva')) return 'critical';
    if (violation.includes('duplicadas')) return 'high';
    if (violation.includes('Ausência')) return 'medium';
    return 'low';
  }

  private async createAuditLog(
    tenantId: string,
    entityType: string,
    entityId: string,
    action: string,
    userId: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    const logData = {
      tenantId,
      entityType,
      entityId,
      action,
      userId,
      oldValues,
      newValues,
      digitalHash: crypto.createHash('sha256')
        .update(`${entityType}-${entityId}-${action}-${Date.now()}`)
        .digest('hex'),
    };

    await db.insert(auditLogs).values(logData);
  }

  // ===== NOVAS FUNCIONALIDADES: GESTÃO DE AUSÊNCIAS =====
  
  async createAbsenceRequest(tenantId: string, data: any): Promise<any> {
    const [request] = await db.insert(absenceRequests).values({
      ...data,
      tenantId,
      submittedAt: new Date(),
    }).returning();
    
    return request;
  }

  async findAbsenceRequestsByUser(userId: string, tenantId: string): Promise<any[]> {
    return await db.select()
      .from(absenceRequests)
      .where(and(
        eq(absenceRequests.tenantId, tenantId),
        eq(absenceRequests.userId, userId)
      ))
      .orderBy(desc(absenceRequests.submittedAt));
  }

  async findPendingAbsenceRequests(tenantId: string): Promise<any[]> {
    return await db.select()
      .from(absenceRequests)
      .where(and(
        eq(absenceRequests.tenantId, tenantId),
        eq(absenceRequests.status, 'pending')
      ))
      .orderBy(desc(absenceRequests.submittedAt));
  }

  async approveAbsenceRequest(requestId: string, tenantId: string, reviewedBy: string, notes?: string): Promise<any> {
    const [updated] = await db.update(absenceRequests)
      .set({
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: notes,
        updatedAt: new Date(),
      })
      .where(and(
        eq(absenceRequests.id, requestId),
        eq(absenceRequests.tenantId, tenantId)
      ))
      .returning();

    return updated;
  }

  // ===== TEMPLATES DE ESCALAS =====
  
  async createScheduleTemplate(tenantId: string, data: any): Promise<any> {
    const [template] = await db.insert(scheduleTemplates).values({
      ...data,
      tenantId,
    }).returning();
    
    return template;
  }

  async findScheduleTemplates(tenantId: string, isActive?: boolean): Promise<any[]> {
    let whereConditions = [eq(scheduleTemplates.tenantId, tenantId)];
    
    if (isActive !== undefined) {
      whereConditions.push(eq(scheduleTemplates.isActive, isActive));
    }
    
    return await db.select()
      .from(scheduleTemplates)
      .where(and(...whereConditions))
      .orderBy(desc(scheduleTemplates.createdAt));
  }

  // ===== TROCA DE TURNOS =====
  
  async createShiftSwapRequest(tenantId: string, data: any): Promise<any> {
    const [request] = await db.insert(shiftSwapRequests).values({
      ...data,
      tenantId,
    }).returning();
    
    return request;
  }

  async findShiftSwapRequests(tenantId: string, userId?: string, status?: string): Promise<any[]> {
    let whereConditions = [eq(shiftSwapRequests.tenantId, tenantId)];
    
    if (userId) {
      whereConditions.push(eq(shiftSwapRequests.requesterId, userId));
    }
    
    if (status) {
      whereConditions.push(eq(shiftSwapRequests.status, status));
    }
    
    return await db.select()
      .from(shiftSwapRequests)
      .where(and(...whereConditions))
      .orderBy(desc(shiftSwapRequests.createdAt));
  }

  // ===== JORNADAS FLEXÍVEIS =====
  
  async createFlexibleWorkArrangement(tenantId: string, data: any): Promise<any> {
    const [arrangement] = await db.insert(flexibleWorkArrangements).values({
      ...data,
      tenantId,
    }).returning();
    
    return arrangement;
  }

  async findFlexibleWorkArrangements(tenantId: string, userId?: string): Promise<any[]> {
    let whereConditions = [eq(flexibleWorkArrangements.tenantId, tenantId)];
    
    if (userId) {
      whereConditions.push(eq(flexibleWorkArrangements.userId, userId));
    }
    
    return await db.select()
      .from(flexibleWorkArrangements)
      .where(and(...whereConditions))
      .orderBy(desc(flexibleWorkArrangements.createdAt));
  }

  // ===== NOTIFICAÇÕES =====
  
  async createScheduleNotification(tenantId: string, data: any): Promise<any> {
    const [notification] = await db.insert(scheduleNotifications).values({
      ...data,
      tenantId,
    }).returning();
    
    return notification;
  }

  async findUserNotifications(userId: string, tenantId: string, unreadOnly?: boolean): Promise<any[]> {
    let whereConditions = [
      eq(scheduleNotifications.tenantId, tenantId),
      eq(scheduleNotifications.userId, userId)
    ];
    
    if (unreadOnly) {
      whereConditions.push(sql`${scheduleNotifications.readAt} IS NULL`);
    }
    
    return await db.select()
      .from(scheduleNotifications)
      .where(and(...whereConditions))
      .orderBy(desc(scheduleNotifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string, tenantId: string, userId: string): Promise<any> {
    const [updated] = await db.update(scheduleNotifications)
      .set({
        readAt: new Date(),
        status: 'read',
        updatedAt: new Date(),
      })
      .where(and(
        eq(scheduleNotifications.id, notificationId),
        eq(scheduleNotifications.tenantId, tenantId),
        eq(scheduleNotifications.userId, userId)
      ))
      .returning();

    return updated;
  }

  // ===== NOVOS MÉTODOS PARA GESTÃO BULK DE ESCALAS =====

  // Aplicar template de escala para múltiplos usuários
  async applyScheduleTemplateToMultipleUsers(
    templateId: string, 
    userIds: string[], 
    tenantId: string, 
    startDate: Date,
    assignedBy: string
  ): Promise<any[]> {
    const template = await db
      .select()
      .from(scheduleTemplates)
      .where(and(
        eq(scheduleTemplates.id, templateId),
        eq(scheduleTemplates.tenantId, tenantId),
        eq(scheduleTemplates.isActive, true)
      ))
      .limit(1);

    if (!template[0]) {
      throw new Error('Template não encontrado ou inativo');
    }

    // Criar registros de escala para todos os usuários
    const scheduleValues = userIds.map(userId => ({
      id: crypto.randomUUID(),
      userId,
      scheduleType: template[0].scheduleType,
      startDate,
      endDate: template[0].rotationCycleDays 
        ? new Date(startDate.getTime() + (template[0].rotationCycleDays * 24 * 60 * 60 * 1000))
        : undefined,
      workDays: template[0].configuration.workDays,
      startTime: template[0].configuration.startTime,
      endTime: template[0].configuration.endTime,
      breakDuration: template[0].configuration.breakDuration,
      flexTimeWindow: template[0].configuration.flexTimeWindow,
      templateId,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const schedules = await db
      .insert(workSchedules)
      .values(scheduleValues)
      .returning();

    // Criar notificações para todos os usuários
    const notificationValues = userIds.map(userId => ({
      id: crypto.randomUUID(),
      userId,
      type: 'schedule_assignment' as const,
      title: 'Nova Escala Atribuída',
      message: `Você foi atribuído ao template de escala "${template[0].name}"`,
      data: {
        templateId,
        templateName: template[0].name,
        startDate: startDate.toISOString(),
        assignedBy,
      },
      tenantId,
      createdAt: new Date(),
    }));

    await db
      .insert(scheduleNotifications)
      .values(notificationValues);

    return schedules;
  }

  // Buscar usuários disponíveis para atribuição de escala
  async findAvailableUsersForSchedule(tenantId: string, excludeUserIds: string[] = []): Promise<any[]> {
    // Esta implementação assume que existe uma tabela users no schema do tenant
    // Em um cenário real, você precisaria ajustar conforme sua estrutura de usuários
    const users = await db.execute(sql`
      SELECT id, first_name, last_name, email, role
      FROM users 
      WHERE tenant_id = ${tenantId}
      ${excludeUserIds.length > 0 ? sql`AND id NOT IN (${sql.join(excludeUserIds.map(id => sql`${id}`), sql`, `)})` : sql``}
      AND active = true
      ORDER BY first_name, last_name
    `);

    return users.rows;
  }

  // Buscar escalas ativas por usuários
  async findActiveSchedulesByUsers(userIds: string[], tenantId: string): Promise<any[]> {
    if (userIds.length === 0) return [];

    const schedules = await db
      .select()
      .from(workSchedules)
      .where(and(
        sql`user_id IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`,
        eq(workSchedules.tenantId, tenantId),
        eq(workSchedules.isActive, true)
      ))
      .orderBy(workSchedules.startDate);

    return schedules;
  }

  // Buscar histórico de aplicações de template
  async findTemplateApplicationHistory(templateId: string, tenantId: string): Promise<any[]> {
    const applications = await db
      .select({
        scheduleId: workSchedules.id,
        userId: workSchedules.userId,
        startDate: workSchedules.startDate,
        endDate: workSchedules.endDate,
        createdAt: workSchedules.createdAt,
        isActive: workSchedules.isActive,
      })
      .from(workSchedules)
      .where(and(
        eq(workSchedules.templateId, templateId),
        eq(workSchedules.tenantId, tenantId)
      ))
      .orderBy(desc(workSchedules.createdAt));

    return applications;
  }

  // Remover escala em lote
  async removeSchedulesFromMultipleUsers(userIds: string[], templateId: string, tenantId: string): Promise<number> {
    const result = await db
      .update(workSchedules)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        sql`user_id IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`,
        eq(workSchedules.templateId, templateId),
        eq(workSchedules.tenantId, tenantId),
        eq(workSchedules.isActive, true)
      ));

    return result.rowCount || 0;
  }
}