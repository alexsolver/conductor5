
export interface ITimecardNotificationClient {
  sendOvertimeAlert(userId: string, hours: number): Promise<void>;
  sendTimecardApprovalRequest(managerId: string, timecardId: string): Promise<void>;
  sendTimecardRejection(userId: string, reason: string): Promise<void>;
}

export class TimecardNotificationClient implements ITimecardNotificationClient {
  async sendOvertimeAlert(userId: string, hours: number): Promise<void> {
    // Implementation for sending overtime alerts
    console.log(`Sending overtime alert for user ${userId}: ${hours} hours`);
  }

  async sendTimecardApprovalRequest(managerId: string, timecardId: string): Promise<void> {
    // Implementation for sending approval requests
    console.log(`Sending approval request to manager ${managerId} for timecard ${timecardId}`);
  }

  async sendTimecardRejection(userId: string, reason: string): Promise<void> {
    // Implementation for sending rejection notifications
    console.log(`Sending rejection notification to user ${userId}: ${reason}`);
  }
}
