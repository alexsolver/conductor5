
export interface IScheduleValidationService {
  validateSchedule(schedule: any): boolean;
  validateTimeSlot(startTime: Date, endTime: Date): boolean;
  checkConflicts(schedule: any, existingSchedules: any[]): boolean;
}
