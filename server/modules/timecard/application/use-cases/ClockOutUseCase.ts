/**
 * ClockOutUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for timecard clock-out business logic
 */

import { ITimecardRepository } from '../../domain/ports/ITimecardRepository';
import { Timecard } from '../../domain/entities/Timecard';
import { TimecardClockDTO } from '../dto/TimecardClockDTO';

interface ClockOutRequest {
  userId: string;
  tenantId: string;
  location?: string;
  notes?: string;
  timestamp: Date;
}

interface ClockOutResponse {
  timecardId: string;
  clockOutTime: Date;
  totalHours: number;
  status: 'success' | 'not_clocked_in';
  message: string;
}

export class ClockOutUseCase {
  constructor(
    private readonly timecardRepository: ITimecardRepository
  ) {}

  async execute(request: ClockOutRequest): Promise<ClockOutResponse> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find existing timecard for today
      const existingTimecard = await this.timecardRepository.findByUserAndDate(
        request.userId,
        request.tenantId,
        today
      );

      if (!existingTimecard) {
        throw new Error('Nenhum timecard encontrado para hoje');
      }

      if (!existingTimecard.isCurrentlyClockedIn()) {
        return {
          timecardId: existingTimecard.getId(),
          clockOutTime: request.timestamp,
          totalHours: existingTimecard.getTotalHours(),
          status: 'not_clocked_in',
          message: 'Usuário não registrou entrada hoje'
        };
      }

      // Clock out
      existingTimecard.clockOut(request.timestamp, request.location, request.notes);
      const updatedTimecard = await this.timecardRepository.update(existingTimecard);

      return {
        timecardId: updatedTimecard.getId(),
        clockOutTime: request.timestamp,
        totalHours: updatedTimecard.getTotalHours(),
        status: 'success',
        message: 'Saída registrada com sucesso'
      };

    } catch (error) {
      console.error('Error in ClockOutUseCase:', error);
      throw new Error('Falha ao registrar saída');
    }
  }
}

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