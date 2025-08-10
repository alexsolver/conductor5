
export class TimecardValidationService {
  validateWorkHours(startTime: Date, endTime: Date): boolean {
    const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursWorked > 12) {
      throw new Error('Cannot work more than 12 hours in a day');
    }
    
    if (hoursWorked < 0) {
      throw new Error('End time cannot be before start time');
    }
    
    return true;
  }

  validateBreakTime(breakStart: Date, breakEnd: Date, workStart: Date, workEnd: Date): boolean {
    if (breakStart < workStart || breakEnd > workEnd) {
      throw new Error('Break time must be within work hours');
    }
    
    return true;
  }
}
