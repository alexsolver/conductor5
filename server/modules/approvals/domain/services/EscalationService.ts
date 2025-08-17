// ✅ 1QA.MD COMPLIANCE: CLEAN ARCHITECTURE - DOMAIN SERVICE
// Domain Service: EscalationService - Business logic for approval escalation and SLA management

import { ApprovalInstance } from '../entities/ApprovalInstance';
import { ApprovalStep } from '../entities/ApprovalStep';
import { ApprovalRule } from '../entities/ApprovalRule';

export interface EscalationAction {
  type: 'reminder' | 'escalation' | 'auto_approve' | 'expire';
  instanceId: string;
  stepId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueAt: Date;
  description: string;
  metadata: Record<string, any>;
}

export interface SlaCalculationResult {
  deadline: Date;
  businessHoursDeadline: Date;
  totalHours: number;
  businessHours: number;
  adjustedForHolidays: boolean;
  adjustedForWeekends: boolean;
}

export interface EscalationConfiguration {
  enableAutomaticEscalation: boolean;
  enableSlaViolationNotifications: boolean;
  enableManagerChainEscalation: boolean;
  reminderThresholds: {
    first: number; // Percentage of SLA (e.g., 75%)
    second: number; // Percentage of SLA (e.g., 90%)
  };
  escalationThreshold: number; // Percentage of SLA (e.g., 95%)
  autoApprovalOnTimeout: boolean;
  autoApprovalTimeoutHours: number;
}

export class EscalationService {
  private readonly defaultConfig: EscalationConfiguration = {
    enableAutomaticEscalation: true,
    enableSlaViolationNotifications: true,
    enableManagerChainEscalation: true,
    reminderThresholds: {
      first: 75,
      second: 90,
    },
    escalationThreshold: 95,
    autoApprovalOnTimeout: false,
    autoApprovalTimeoutHours: 168, // 1 week
  };

  constructor(
    private readonly config: Partial<EscalationConfiguration> = {}
  ) {}

  // Calculate SLA deadline for an approval instance
  calculateSlaDeadline(
    startTime: Date,
    slaHours: number,
    workingHours?: { start: number; end: number },
    holidays?: Date[]
  ): SlaCalculationResult {
    const totalHours = slaHours;
    let deadline = new Date(startTime.getTime() + (slaHours * 60 * 60 * 1000));
    let businessHoursDeadline = deadline;
    let adjustedForHolidays = false;
    let adjustedForWeekends = false;

    // If working hours are specified, calculate business hours deadline
    if (workingHours) {
      businessHoursDeadline = this.calculateBusinessHoursDeadline(
        startTime,
        slaHours,
        workingHours,
        holidays
      );
      
      if (holidays && holidays.length > 0) {
        adjustedForHolidays = true;
      }
      
      adjustedForWeekends = true;
    }

    return {
      deadline,
      businessHoursDeadline,
      totalHours,
      businessHours: slaHours,
      adjustedForHolidays,
      adjustedForWeekends,
    };
  }

  // Identify instances that need escalation actions
  identifyEscalationActions(
    instances: ApprovalInstance[],
    steps: Map<string, ApprovalStep[]>,
    rules: Map<string, ApprovalRule>
  ): EscalationAction[] {
    const actions: EscalationAction[] = [];
    const config = { ...this.defaultConfig, ...this.config };

    for (const instance of instances) {
      if (instance.isCompleted()) continue;

      const rule = rules.get(instance.ruleId);
      if (!rule) continue;

      // Check for reminder actions
      if (instance.needsFirstReminder()) {
        actions.push({
          type: 'reminder',
          instanceId: instance.id,
          priority: this.calculatePriority(instance),
          dueAt: new Date(),
          description: 'First reminder for pending approval',
          metadata: {
            reminderType: 'first',
            slaDeadline: instance.slaDeadline,
            urgencyLevel: instance.urgencyLevel,
          },
        });
      }

      if (instance.needsSecondReminder()) {
        actions.push({
          type: 'reminder',
          instanceId: instance.id,
          priority: this.calculatePriority(instance),
          dueAt: new Date(),
          description: 'Final reminder for pending approval',
          metadata: {
            reminderType: 'second',
            slaDeadline: instance.slaDeadline,
            urgencyLevel: instance.urgencyLevel,
          },
        });
      }

      // Check for escalation actions
      if (config.enableAutomaticEscalation && instance.needsEscalation()) {
        actions.push({
          type: 'escalation',
          instanceId: instance.id,
          priority: this.calculatePriority(instance),
          dueAt: new Date(),
          description: 'Automatic escalation due to SLA approaching',
          metadata: {
            escalationReason: 'SLA_THRESHOLD_REACHED',
            slaDeadline: instance.slaDeadline,
            escalationThreshold: config.escalationThreshold,
          },
        });
      }

      // Check for expiration actions
      if (instance.isOverdue()) {
        if (config.autoApprovalOnTimeout) {
          actions.push({
            type: 'auto_approve',
            instanceId: instance.id,
            priority: 'urgent',
            dueAt: new Date(),
            description: 'Auto-approval due to timeout',
            metadata: {
              reason: 'TIMEOUT_AUTO_APPROVAL',
              originalSlaDeadline: instance.slaDeadline,
            },
          });
        } else {
          actions.push({
            type: 'expire',
            instanceId: instance.id,
            priority: 'urgent',
            dueAt: new Date(),
            description: 'Instance expired due to SLA violation',
            metadata: {
              reason: 'SLA_VIOLATION',
              slaDeadline: instance.slaDeadline,
            },
          });
        }
      }
    }

    // Sort actions by priority and due date
    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return a.dueAt.getTime() - b.dueAt.getTime();
    });
  }

  // Calculate escalation path for manager chain
  calculateManagerChainEscalation(
    currentApproverId: string,
    userHierarchy: Map<string, string[]>, // userId -> [managerId1, managerId2, ...]
    maxLevels: number = 3
  ): string[] {
    const escalationPath: string[] = [];
    const hierarchy = userHierarchy.get(currentApproverId) || [];
    
    for (let i = 0; i < Math.min(hierarchy.length, maxLevels); i++) {
      escalationPath.push(hierarchy[i]);
    }
    
    return escalationPath;
  }

  // Generate escalation notifications
  generateEscalationNotifications(
    action: EscalationAction,
    instance: ApprovalInstance,
    rule: ApprovalRule
  ): {
    recipients: string[];
    subject: string;
    content: string;
    urgency: 'low' | 'medium' | 'high';
    channels: string[];
  } {
    const baseNotification = {
      urgency: this.mapPriorityToUrgency(action.priority),
      channels: this.getNotificationChannels(action.type, action.priority),
    };

    switch (action.type) {
      case 'reminder':
        return {
          ...baseNotification,
          recipients: this.getStepApprovers(instance, rule),
          subject: `Approval Reminder: ${rule.name}`,
          content: this.generateReminderContent(instance, rule, action.metadata),
        };

      case 'escalation':
        return {
          ...baseNotification,
          recipients: this.getEscalationRecipients(instance, rule),
          subject: `Approval Escalation: ${rule.name}`,
          content: this.generateEscalationContent(instance, rule, action.metadata),
        };

      case 'expire':
        return {
          ...baseNotification,
          recipients: this.getExpirationRecipients(instance, rule),
          subject: `Approval Expired: ${rule.name}`,
          content: this.generateExpirationContent(instance, rule, action.metadata),
        };

      case 'auto_approve':
        return {
          ...baseNotification,
          recipients: this.getAutoApprovalRecipients(instance, rule),
          subject: `Auto-Approved: ${rule.name}`,
          content: this.generateAutoApprovalContent(instance, rule, action.metadata),
        };

      default:
        throw new Error(`Unknown escalation action type: ${action.type}`);
    }
  }

  // Private helper methods
  private calculateBusinessHoursDeadline(
    startTime: Date,
    hoursNeeded: number,
    workingHours: { start: number; end: number },
    holidays?: Date[]
  ): Date {
    let currentTime = new Date(startTime);
    let remainingHours = hoursNeeded;

    while (remainingHours > 0) {
      // Skip weekends
      if (currentTime.getDay() === 0 || currentTime.getDay() === 6) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(workingHours.start, 0, 0, 0);
        continue;
      }

      // Skip holidays
      if (holidays && holidays.some(holiday => 
        holiday.toDateString() === currentTime.toDateString()
      )) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(workingHours.start, 0, 0, 0);
        continue;
      }

      const dayStart = workingHours.start;
      const dayEnd = workingHours.end;
      const currentHour = currentTime.getHours();

      // If before working hours, move to start of working day
      if (currentHour < dayStart) {
        currentTime.setHours(dayStart, 0, 0, 0);
        continue;
      }

      // If after working hours, move to next working day
      if (currentHour >= dayEnd) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(dayStart, 0, 0, 0);
        continue;
      }

      // Calculate remaining hours in current working day
      const hoursLeftInDay = dayEnd - currentHour;
      
      if (remainingHours <= hoursLeftInDay) {
        // Finish within this day
        currentTime.setHours(currentHour + remainingHours);
        remainingHours = 0;
      } else {
        // Move to next working day
        remainingHours -= hoursLeftInDay;
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(dayStart, 0, 0, 0);
      }
    }

    return currentTime;
  }

  private calculatePriority(instance: ApprovalInstance): 'low' | 'medium' | 'high' | 'urgent' {
    const urgencyLevel = instance.urgencyLevel;
    const timeRemaining = instance.getTimeRemaining();
    const slaUsage = instance.getSlaUsagePercentage();

    if (urgencyLevel >= 5 || (slaUsage && slaUsage >= 95)) {
      return 'urgent';
    }

    if (urgencyLevel >= 4 || (slaUsage && slaUsage >= 85)) {
      return 'high';
    }

    if (urgencyLevel >= 3 || (slaUsage && slaUsage >= 75)) {
      return 'medium';
    }

    return 'low';
  }

  private mapPriorityToUrgency(priority: string): 'low' | 'medium' | 'high' {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  private getNotificationChannels(actionType: string, priority: string): string[] {
    const channels = ['email', 'in_app'];
    
    if (priority === 'urgent') {
      channels.push('sms');
    }
    
    if (actionType === 'escalation' || actionType === 'expire') {
      channels.push('slack');
    }
    
    return channels;
  }

  private getStepApprovers(instance: ApprovalInstance, rule: ApprovalRule): string[] {
    // This would need to be implemented based on the current step's approvers
    // For now, return empty array - this would be populated by the application layer
    return [];
  }

  private getEscalationRecipients(instance: ApprovalInstance, rule: ApprovalRule): string[] {
    // Return managers or escalation contacts
    return [];
  }

  private getExpirationRecipients(instance: ApprovalInstance, rule: ApprovalRule): string[] {
    // Return requester and administrators
    return [instance.requestedById];
  }

  private getAutoApprovalRecipients(instance: ApprovalInstance, rule: ApprovalRule): string[] {
    // Return requester and relevant stakeholders
    return [instance.requestedById];
  }

  private generateReminderContent(instance: ApprovalInstance, rule: ApprovalRule, metadata: any): string {
    return `Your approval is required for: ${rule.name}\n\nRequest ID: ${instance.id}\nDeadline: ${instance.slaDeadline}\nUrgency: ${instance.urgencyLevel}`;
  }

  private generateEscalationContent(instance: ApprovalInstance, rule: ApprovalRule, metadata: any): string {
    return `An approval request has been escalated: ${rule.name}\n\nRequest ID: ${instance.id}\nOriginal Deadline: ${instance.slaDeadline}\nEscalation Reason: ${metadata.escalationReason}`;
  }

  private generateExpirationContent(instance: ApprovalInstance, rule: ApprovalRule, metadata: any): string {
    return `An approval request has expired: ${rule.name}\n\nRequest ID: ${instance.id}\nExpired At: ${instance.slaDeadline}`;
  }

  private generateAutoApprovalContent(instance: ApprovalInstance, rule: ApprovalRule, metadata: any): string {
    return `Request auto-approved due to timeout: ${rule.name}\n\nRequest ID: ${instance.id}\nAuto-approved At: ${new Date()}`;
  }
}