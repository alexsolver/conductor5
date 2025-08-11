/**
 * ClockOutUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for timecard clock-out business logic
 */

import { Timecard } from '../../domain/entities/Timecard';

interface TimecardRepositoryInterface {
  findByUserAndDate(userId: string, date: Date, tenantId: string): Promise<Timecard | null>;
  update(timecard: Timecard): Promise<void>;
}

export interface ClockOutRequest {
  tenantId: string;
  userId: string;
  notes?: string;
}

export interface ClockOutResponse {
  success: boolean;
  message: string;
  data?: {
    timecardId: string;
    clockOutTime: Date;
    totalHoursToday: number;
    sessionDuration: number;
    notes: string | null;
  };
}

export class ClockOutUseCase {
  constructor(
    private readonly timecardRepository: TimecardRepositoryInterface
  ) {}

  async execute(request: ClockOutRequest): Promise<ClockOutResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Find timecard for today
    const timecard = await this.timecardRepository.findByUserAndDate(
      request.userId,
      today,
      request.tenantId
    );

    if (!timecard) {
      return {
        success: false,
        message: 'No timecard found for today - please clock in first'
      };
    }

    try {
      // Calculate session duration before clocking out
      const sessionDuration = timecard.getCurrentSessionDuration();

      // Clock out
      timecard.clockOut(request.notes);

      // Update in repository
      await this.timecardRepository.update(timecard);

      return {
        success: true,
        message: 'Clock out successful',
        data: {
          timecardId: timecard.getId(),
          clockOutTime: new Date(),
          totalHoursToday: timecard.getTotalHours(),
          sessionDuration,
          notes: request.notes || null
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clock out';
      return {
        success: false,
        message
      };
    }
  }
}