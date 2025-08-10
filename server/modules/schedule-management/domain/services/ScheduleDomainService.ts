
import { Schedule } from '../entities/Schedule';

export class ScheduleDomainService {
  validateScheduleConstraints(schedule: Schedule): boolean {
    // Validate business rules
    if (schedule.scheduledDate <= new Date()) {
      throw new Error('Schedule date must be in the future');
    }
    
    return true;
  }

  canReschedule(schedule: Schedule): boolean {
    const now = new Date();
    const scheduledTime = new Date(schedule.scheduledDate);
    const hoursDifference = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursDifference >= 24; // Can reschedule if at least 24 hours in advance
  }
}
