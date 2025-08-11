/**
 * ClockInUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for timecard clock-in business logic
 */

import { ITimecardRepository } from '../../domain/ports/ITimecardRepository';
import { Timecard } from '../../domain/entities/Timecard';
import { TimecardClockDTO } from '../dto/TimecardClockDTO';

interface ClockInRequest {
  userId: string;
  tenantId: string;
  location?: string;
  notes?: string;
  timestamp: Date;
}

interface ClockInResponse {
  timecardId: string;
  clockInTime: Date;
  status: 'success' | 'already_clocked_in';
  message: string;
}

export class ClockInUseCase {
  constructor(
    private readonly timecardRepository: ITimecardRepository
  ) {}

  async execute(request: ClockInRequest): Promise<ClockInResponse> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user already has a timecard for today
      let existingTimecard = await this.timecardRepository.findByUserAndDate(
        request.userId,
        request.tenantId,
        today
      );

      if (existingTimecard) {
        // Check if already clocked in
        if (existingTimecard.isCurrentlyClockedIn()) {
          return {
            timecardId: existingTimecard.getId(),
            clockInTime: request.timestamp,
            status: 'already_clocked_in',
            message: 'Usuário já registrou entrada hoje'
          };
        }

        // Add new clock-in entry to existing timecard
        existingTimecard.clockIn(request.timestamp, request.location, request.notes);
        const updatedTimecard = await this.timecardRepository.update(existingTimecard);

        return {
          timecardId: updatedTimecard.getId(),
          clockInTime: request.timestamp,
          status: 'success',
          message: 'Entrada registrada com sucesso'
        };
      } else {
        // Create new timecard for today
        const newTimecard = new Timecard(
          crypto.randomUUID(),
          request.tenantId,
          request.userId,
          today,
          [{
            clockIn: request.timestamp,
            clockOut: null,
            location: request.location || null,
            notes: request.notes || null,
            breakTime: 0
          }],
          'open',
          0, // total_hours will be calculated
          0, // total_break_time
          0, // overtime_hours
          0, // regular_hours
          null, // approved_by_id
          null, // approved_at
          null, // submitted_at
          request.notes || '',
          new Date(),
          new Date()
        );

        const savedTimecard = await this.timecardRepository.save(newTimecard);

        return {
          timecardId: savedTimecard.getId(),
          clockInTime: request.timestamp,
          status: 'success',
          message: 'Entrada registrada com sucesso'
        };
      }

    } catch (error) {
      console.error('Error in ClockInUseCase:', error);
      throw new Error('Falha ao registrar entrada');
    }
  }
}

interface TimecardRepositoryInterface {
  findByUserAndDate(userId: string, date: Date, tenantId: string): Promise<Timecard | null>;
  save(timecard: Timecard): Promise<void>;
  update(timecard: Timecard): Promise<void>;
}

export interface ClockInRequest {
  tenantId: string;
  userId: string;
  location?: string;
  notes?: string;
}

export interface ClockInResponse {
  success: boolean;
  message: string;
  data?: {
    timecardId: string;
    clockInTime: Date;
    location: string | null;
    notes: string | null;
  };
}

export class ClockInUseCase {
  constructor(
    private readonly timecardRepository: TimecardRepositoryInterface
  ) {}

  async execute(request: ClockInRequest): Promise<ClockInResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Find or create timecard for today
    let timecard = await this.timecardRepository.findByUserAndDate(
      request.userId,
      today,
      request.tenantId
    );

    try {
      if (!timecard) {
        // Create new timecard for today
        timecard = new Timecard(
          generateId(),
          request.tenantId,
          request.userId,
          today
        );
        
        timecard.clockIn(request.location, request.notes);
        await this.timecardRepository.save(timecard);
      } else {
        // Use existing timecard
        timecard.clockIn(request.location, request.notes);
        await this.timecardRepository.update(timecard);
      }

      // Get the latest entry for response
      const entries = timecard.getEntries();
      const latestEntry = entries[entries.length - 1];

      return {
        success: true,
        message: 'Clock in successful',
        data: {
          timecardId: timecard.getId(),
          clockInTime: latestEntry.clockIn,
          location: latestEntry.location,
          notes: latestEntry.notes
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clock in';
      return {
        success: false,
        message
      };
    }
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}