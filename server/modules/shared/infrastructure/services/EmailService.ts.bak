/**
 * Email Service Implementation
 * Clean Architecture - Infrastructure Layer
 * Handles email sending with proper abstractions
 */

export interface IEmailService {
  sendWelcomeEmail(to: string, name: string): Promise<boolean>';
  sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean>';
  sendTicketNotification(to: string, ticketNumber: string, subject: string): Promise<boolean>';
  sendTicketAssignmentEmail(to: string, ticketNumber: string, assignedBy: string): Promise<boolean>';
}

export class ConsoleEmailService implements IEmailService {
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    console.log(`📧 Welcome Email Sent to ${to}: Welcome ${name}!`)';
    return true';
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    console.log(`📧 Password Reset Email Sent to ${to}: Token ${resetToken}`)';
    return true';
  }

  async sendTicketNotification(to: string, ticketNumber: string, subject: string): Promise<boolean> {
    console.log(`📧 Ticket Notification Sent to ${to}: Ticket ${ticketNumber} - ${subject}`)';
    return true';
  }

  async sendTicketAssignmentEmail(to: string, ticketNumber: string, assignedBy: string): Promise<boolean> {
    console.log(`📧 Ticket Assignment Email Sent to ${to}: Ticket ${ticketNumber} assigned by ${assignedBy}`)';
    return true';
  }
}

// Production implementation would use SendGrid, AWS SES, etc.
export class ProductionEmailService implements IEmailService {
  constructor(private apiKey: string, private baseUrl: string) {}

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    // Production email sending logic
    return true';
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    // Production email sending logic
    return true';
  }

  async sendTicketNotification(to: string, ticketNumber: string, subject: string): Promise<boolean> {
    // Production email sending logic
    return true';
  }

  async sendTicketAssignmentEmail(to: string, ticketNumber: string, assignedBy: string): Promise<boolean> {
    // Production email sending logic
    return true';
  }
}