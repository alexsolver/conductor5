// DOMAIN SERVICE - Clean Architecture
// Domain layer - Business logic and domain rules

import { NotificationEntity } from '../entities/Notification';
import { NotificationSeverity, NotificationChannelType } from '@shared/schema-notifications';

export class NotificationDomainService {
  
  /**
   * Determine appropriate channels based on notification type and severity
   */
  determineOptimalChannels(
    type: string, 
    severity: NotificationSeverity,
    userPreferences?: NotificationChannelType[]
  ): NotificationChannelType[] {
    // Critical system alerts always use all channels
    if (type.startsWith('system_') && severity === 'critical') {
      return ['in_app', 'email', 'sms', 'dashboard_alert'];
    }

    // Security alerts use high-priority channels
    if (type.startsWith('security_')) {
      return ['in_app', 'email', 'sms'];
    }

    // Field operations need real-time channels
    if (type.startsWith('field_')) {
      return ['in_app', 'push', 'sms'];
    }

    // Ticket notifications use standard channels
    if (type.startsWith('ticket_')) {
      return ['in_app', 'email'];
    }

    // Timecard notifications are usually low priority
    if (type.startsWith('timecard_')) {
      return ['in_app'];
    }

    // Respect user preferences for non-critical notifications
    if (userPreferences && userPreferences.length > 0 && severity !== 'critical') {
      return userPreferences;
    }

    // Default channels
    return ['in_app', 'email'];
  }

  /**
   * Calculate retry strategy based on notification type and current attempt
   */
  calculateRetryStrategy(notification: NotificationEntity): {
    shouldRetry: boolean;
    retryAfter: number; // seconds
    maxRetries: number;
  } {
    const type = notification.getType();
    const currentRetries = notification.getRetryCount();
    const severity = notification.getSeverity();

    // Critical system alerts have aggressive retry
    if (type.startsWith('system_') && severity === 'critical') {
      return {
        shouldRetry: currentRetries < 5,
        retryAfter: Math.min(30 * Math.pow(2, currentRetries), 300), // Exponential backoff, max 5 minutes
        maxRetries: 5
      };
    }

    // Security alerts need reliable delivery
    if (type.startsWith('security_')) {
      return {
        shouldRetry: currentRetries < 3,
        retryAfter: Math.min(60 * Math.pow(2, currentRetries), 600), // Exponential backoff, max 10 minutes
        maxRetries: 3
      };
    }

    // Field operations need timely delivery
    if (type.startsWith('field_')) {
      return {
        shouldRetry: currentRetries < 2,
        retryAfter: 120, // 2 minutes fixed interval
        maxRetries: 2
      };
    }

    // Standard retry for other types
    return {
      shouldRetry: currentRetries < 3,
      retryAfter: Math.min(300 * Math.pow(2, currentRetries), 1800), // Exponential backoff, max 30 minutes
      maxRetries: 3
    };
  }

  /**
   * Determine if notification should be escalated
   */
  shouldEscalateNotification(notification: NotificationEntity): {
    shouldEscalate: boolean;
    escalationReason: string;
    newSeverity?: NotificationSeverity;
  } {
    const type = notification.getType();
    const severity = notification.getSeverity();
    const status = notification.getStatus();
    const scheduledAt = notification.getScheduledAt();
    const failedAt = notification.getFailedAt();
    const retryCount = notification.getRetryCount();

    // Failed critical notifications should be escalated
    if (severity === 'critical' && status === 'failed' && retryCount >= 2) {
      return {
        shouldEscalate: true,
        escalationReason: 'Critical notification failed multiple times',
      };
    }

    // System alerts pending too long
    if (type.startsWith('system_') && status === 'pending') {
      const minutesPending = (Date.now() - scheduledAt.getTime()) / (1000 * 60);
      if (minutesPending > 15) {
        return {
          shouldEscalate: true,
          escalationReason: 'System alert pending for more than 15 minutes',
          newSeverity: severity === 'critical' ? 'critical' : 'high'
        };
      }
    }

    // Security alerts should escalate quickly
    if (type.startsWith('security_') && status === 'pending') {
      const minutesPending = (Date.now() - scheduledAt.getTime()) / (1000 * 60);
      if (minutesPending > 5) {
        return {
          shouldEscalate: true,
          escalationReason: 'Security alert pending for more than 5 minutes',
          newSeverity: 'critical'
        };
      }
    }

    // Field operations need timely escalation
    if (type.startsWith('field_') && status === 'failed') {
      return {
        shouldEscalate: true,
        escalationReason: 'Field operation notification failed',
        newSeverity: 'high'
      };
    }

    return {
      shouldEscalate: false,
      escalationReason: ''
    };
  }

  /**
   * Validate notification business rules
   */
  validateNotificationRules(notification: NotificationEntity): {
    isValid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check required fields
    if (!notification.getTitle().trim()) {
      violations.push('Title is required');
    }

    if (!notification.getMessage().trim()) {
      violations.push('Message is required');
    }

    if (!notification.getTenantId()) {
      violations.push('Tenant ID is required');
    }

    if (notification.getChannels().length === 0) {
      violations.push('At least one delivery channel is required');
    }

    // Check expiration logic
    const expiresAt = notification.getExpiresAt();
    const scheduledAt = notification.getScheduledAt();
    
    if (expiresAt && expiresAt <= scheduledAt) {
      violations.push('Expiration date must be after scheduled date');
    }

    // Check retry limits
    if (notification.getMaxRetries() < 0) {
      violations.push('Max retries must be non-negative');
    }

    // Business-specific validations
    const type = notification.getType();
    
    // System alerts should have critical or high severity
    if (type.startsWith('system_')) {
      const severity = notification.getSeverity();
      if (!['critical', 'high'].includes(severity)) {
        violations.push('System alerts should have critical or high severity');
      }
    }

    // Security alerts must have related entity
    if (type.startsWith('security_')) {
      if (!notification.getRelatedEntityType() || !notification.getRelatedEntityId()) {
        violations.push('Security alerts must have related entity information');
      }
    }

    // Field alerts must have user assignment
    if (type.startsWith('field_')) {
      if (!notification.getUserId()) {
        violations.push('Field alerts must be assigned to a user');
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Generate notification content based on template and variables
   */
  generateNotificationContent(
    templateTitle: string,
    templateMessage: string,
    variables: Record<string, any>
  ): { title: string; message: string } {
    let title = templateTitle;
    let message = templateMessage;

    // Simple template variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return { title, message };
  }

  /**
   * Determine notification priority for processing queue
   */
  calculateProcessingPriority(notification: NotificationEntity): number {
    let priority = 0;

    // Severity-based priority
    switch (notification.getSeverity()) {
      case 'critical': priority += 1000; break;
      case 'high': priority += 500; break;
      case 'medium': priority += 100; break;
      case 'low': priority += 10; break;
    }

    // Type-based priority adjustments
    const type = notification.getType();
    if (type.startsWith('system_')) priority += 200;
    if (type.startsWith('security_')) priority += 150;
    if (type.startsWith('field_')) priority += 100;

    // Time-based priority (older notifications get higher priority)
    const ageInMinutes = (Date.now() - notification.getScheduledAt().getTime()) / (1000 * 60);
    priority += Math.floor(ageInMinutes * 2);

    // Retry penalty (failed notifications get lower priority)
    priority -= notification.getRetryCount() * 50;

    return Math.max(0, priority);
  }

  /**
   * Check if notification delivery window is valid
   */
  isWithinDeliveryWindow(notification: NotificationEntity, userTimezone: string = 'America/Sao_Paulo'): boolean {
    const type = notification.getType();
    const severity = notification.getSeverity();

    // Critical and system alerts can be sent anytime
    if (severity === 'critical' || type.startsWith('system_') || type.startsWith('security_')) {
      return true;
    }

    // Check business hours for non-critical notifications
    const now = new Date();
    const hour = now.getHours();
    
    // Business hours: 8 AM to 8 PM
    return hour >= 8 && hour < 20;
  }
}