
/**
 * GetTimecardReportsUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing use case implementation
 */

import { ITimecardRepository } from '../../domain/ports/ITimecardRepository';

interface GetTimecardReportsRequest {
  userId: string;
  tenantId: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
}

interface TimecardReportEntry {
  date: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakTime: number;
  status: string;
  entries: Array<{
    clockIn: Date;
    clockOut: Date | null;
    duration: number;
    location: string | null;
    notes: string | null;
  }>;
}

interface GetTimecardReportsResponse {
  period: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalBreakTime: number;
  averageHoursPerDay: number;
  efficiencyScore: number;
  timecards: TimecardReportEntry[];
}

export class GetTimecardReportsUseCase {
  constructor(
    private readonly timecardRepository: ITimecardRepository
  ) {}

  async execute(request: GetTimecardReportsRequest): Promise<GetTimecardReportsResponse> {
    try {
      // Determine date range
      const { startDate, endDate } = this.calculateDateRange(
        request.period || 'current-month',
        request.startDate,
        request.endDate
      );

      // Get timecards for the period
      const timecards = await this.timecardRepository.findByUserAndDateRange(
        request.userId,
        request.tenantId,
        startDate,
        endDate
      );

      // Process timecards data
      const reportEntries: TimecardReportEntry[] = timecards.map(timecard => ({
        date: timecard.getDate(),
        totalHours: timecard.getTotalHours(),
        regularHours: timecard.getRegularHours(),
        overtimeHours: timecard.getOvertimeHours(),
        breakTime: timecard.getTotalBreakTime(),
        status: timecard.getStatus(),
        entries: timecard.getEntries().map(entry => ({
          clockIn: entry.clockIn,
          clockOut: entry.clockOut,
          duration: entry.clockOut 
            ? (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60)
            : 0,
          location: entry.location,
          notes: entry.notes
        }))
      }));

      // Calculate totals
      const totalHours = timecards.reduce((sum, tc) => sum + tc.getTotalHours(), 0);
      const totalRegularHours = timecards.reduce((sum, tc) => sum + tc.getRegularHours(), 0);
      const totalOvertimeHours = timecards.reduce((sum, tc) => sum + tc.getOvertimeHours(), 0);
      const totalBreakTime = timecards.reduce((sum, tc) => sum + tc.getTotalBreakTime(), 0);
      
      const totalDays = timecards.length;
      const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
      
      // Calculate efficiency score (average of all timecard efficiency scores)
      const efficiencyScore = totalDays > 0 
        ? timecards.reduce((sum, tc) => sum + tc.getEfficiencyScore(), 0) / totalDays
        : 100;

      return {
        period: request.period || 'custom',
        startDate,
        endDate,
        totalDays,
        totalHours,
        totalRegularHours,
        totalOvertimeHours,
        totalBreakTime,
        averageHoursPerDay,
        efficiencyScore,
        timecards: reportEntries
      };

    } catch (error) {
      console.error('Error in GetTimecardReportsUseCase:', error);
      throw new Error('Falha ao gerar relatório de timecard');
    }
  }

  private calculateDateRange(
    period: string,
    startDate?: Date,
    endDate?: Date
  ): { startDate: Date; endDate: Date } {
    const now = new Date();

    if (period === 'custom' && startDate && endDate) {
      return { startDate, endDate };
    }

    switch (period) {
      case 'today':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        };

      case 'current-week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { startDate: weekStart, endDate: weekEnd };

      case 'current-month':
      default:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
    }
  }
}
