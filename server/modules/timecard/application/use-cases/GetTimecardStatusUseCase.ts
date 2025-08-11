
/**
 * GetTimecardStatusUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing use case implementation
 */

import { ITimecardRepository } from '../../domain/ports/ITimecardRepository';
import { Timecard } from '../../domain/entities/Timecard';

interface GetTimecardStatusRequest {
  userId: string;
  tenantId: string;
}

interface GetTimecardStatusResponse {
  isCurrentlyClockedIn: boolean;
  currentSessionDuration?: number;
  todayTotalHours: number;
  weeklyTotalHours: number;
  currentTimecard?: {
    id: string;
    date: Date;
    status: string;
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    entries: Array<{
      clockIn: Date;
      clockOut: Date | null;
      location: string | null;
      notes: string | null;
      breakTime: number;
    }>;
  };
}

export class GetTimecardStatusUseCase {
  constructor(
    private readonly timecardRepository: ITimecardRepository
  ) {}

  async execute(request: GetTimecardStatusRequest): Promise<GetTimecardStatusResponse> {
    try {
      // Get today's timecard
      const today = new Date();
      const currentTimecard = await this.timecardRepository.findByUserAndDate(
        request.userId,
        request.tenantId,
        today
      );

      // Calculate today's total hours
      const todayTotalHours = currentTimecard ? currentTimecard.getTotalHours() : 0;

      // Calculate weekly total hours
      const weekStart = this.getWeekStart(today);
      const weekEnd = this.getWeekEnd(today);
      const weeklyTimecards = await this.timecardRepository.findByUserAndDateRange(
        request.userId,
        request.tenantId,
        weekStart,
        weekEnd
      );
      
      const weeklyTotalHours = weeklyTimecards.reduce((total, timecard) => {
        return total + timecard.getTotalHours();
      }, 0);

      // Build response
      const response: GetTimecardStatusResponse = {
        isCurrentlyClockedIn: currentTimecard ? currentTimecard.isCurrentlyClockedIn() : false,
        todayTotalHours,
        weeklyTotalHours
      };

      if (currentTimecard) {
        response.currentSessionDuration = currentTimecard.getCurrentSessionDuration();
        response.currentTimecard = {
          id: currentTimecard.getId(),
          date: currentTimecard.getDate(),
          status: currentTimecard.getStatus(),
          totalHours: currentTimecard.getTotalHours(),
          regularHours: currentTimecard.getRegularHours(),
          overtimeHours: currentTimecard.getOvertimeHours(),
          entries: currentTimecard.getEntries().map(entry => ({
            clockIn: entry.clockIn,
            clockOut: entry.clockOut,
            location: entry.location,
            notes: entry.notes,
            breakTime: entry.breakTime
          }))
        };
      }

      return response;

    } catch (error) {
      console.error('Error in GetTimecardStatusUseCase:', error);
      throw new Error('Falha ao buscar status do timecard');
    }
  }

  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getWeekEnd(date: Date): Date {
    const end = new Date(date);
    const day = end.getDay();
    const diff = end.getDate() + (6 - day);
    end.setDate(diff);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
