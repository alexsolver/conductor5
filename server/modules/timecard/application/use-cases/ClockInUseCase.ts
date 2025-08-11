/**
 * ClockInUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for timecard clock-in business logic
 */

import { Timecard } from '../../domain/entities/Timecard';

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