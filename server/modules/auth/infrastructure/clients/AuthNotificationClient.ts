
export interface IAuthNotificationClient {
  sendWelcomeEmail(userId: string, email: string): Promise<void>;
  sendPasswordResetEmail(userId: string, email: string, resetToken: string): Promise<void>;
  sendLoginAlert(userId: string, email: string, ipAddress: string): Promise<void>;
}

export class AuthNotificationClient implements IAuthNotificationClient {
  async sendWelcomeEmail(userId: string, email: string): Promise<void> {
    // Implementation for sending welcome emails
    console.log(`Sending welcome email to ${email} for user ${userId}`);
  }

  async sendPasswordResetEmail(userId: string, email: string, resetToken: string): Promise<void> {
    // Implementation for sending password reset emails
    console.log(`Sending password reset email to ${email} with token ${resetToken}`);
  }

  async sendLoginAlert(userId: string, email: string, ipAddress: string): Promise<void> {
    // Implementation for sending login alerts
    console.log(`Sending login alert to ${email} from IP ${ipAddress}`);
  }
}
