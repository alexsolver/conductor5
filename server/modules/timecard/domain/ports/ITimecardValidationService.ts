
export interface ITimecardValidationService {
  validateHours(hours: number): boolean;
  validateTimecard(timecard: any): boolean;
}
