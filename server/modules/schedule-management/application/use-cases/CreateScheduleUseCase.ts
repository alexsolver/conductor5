/**
 * CreateScheduleUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for schedule creation business logic
 */

import { Schedule } from '../../domain/entities/Schedule';

interface ScheduleRepositoryInterface {
  save(schedule: Schedule): Promise<void>;
  findConflicting(startTime: Date, endTime: Date, tenantId: string): Promise<Schedule[]>;
}

interface ScheduleAttendee {
  userId: string;
  name: string;
  email: string;
  role: 'organizer' | 'required' | 'optional';
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface CreateScheduleRequest {
  tenantId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: ScheduleAttendee[];
  type?: 'meeting' | 'task' | 'reminder' | 'event';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  isAllDay?: boolean;
  reminders?: number[]; // minutes before
  metadata?: Record<string, any>;
}

export interface CreateScheduleResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    status: string;
    conflicts?: Array<{
      id: string;
      title: string;
      startTime: Date;
      endTime: Date;
    }>;
  };
}

export class CreateScheduleUseCase {
  constructor(
    private readonly scheduleRepository: ScheduleRepositoryInterface
  ) {}

  async execute(request: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    // Validate required fields
    if (!request.title || !request.description) {
      return {
        success: false,
        message: 'Title and description are required'
      };
    }

    if (!request.startTime || !request.endTime) {
      return {
        success: false,
        message: 'Start time and end time are required'
      };
    }

    try {
      // Create schedule entity
      const schedule = new Schedule(
        generateId(),
        request.tenantId,
        request.title,
        request.description,
        request.startTime,
        request.endTime,
        request.location || '',
        [],
        null, // no recurrence initially
        'scheduled',
        request.type || 'meeting',
        request.priority || 'medium',
        request.isAllDay || false
      );

      // Add attendees if provided
      if (request.attendees) {
        request.attendees.forEach(attendee => {
          schedule.addAttendee(attendee);
        });
      }

      // Add reminders if provided
      if (request.reminders) {
        request.reminders.forEach(minutes => {
          schedule.addReminder(minutes);
        });
      }

      // Check for conflicts
      const conflictingSchedules = await this.scheduleRepository.findConflicting(
        request.startTime,
        request.endTime,
        request.tenantId
      );

      // Save schedule
      await this.scheduleRepository.save(schedule);

      const conflicts = conflictingSchedules.map(conflict => ({
        id: conflict.getId(),
        title: conflict.getTitle(),
        startTime: conflict.getStartTime(),
        endTime: conflict.getEndTime()
      }));

      return {
        success: true,
        message: conflicts.length > 0 
          ? `Schedule created successfully with ${conflicts.length} conflicts detected`
          : 'Schedule created successfully',
        data: {
          id: schedule.getId(),
          title: schedule.getTitle(),
          startTime: schedule.getStartTime(),
          endTime: schedule.getEndTime(),
          status: schedule.getStatus(),
          conflicts: conflicts.length > 0 ? conflicts : undefined
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create schedule';
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