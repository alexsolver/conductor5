// ✅ 1QA.MD COMPLIANCE: Activity Instance Domain Entity
// Clean Architecture Domain Layer - Activity Instance Entity

import { z } from 'zod';

export const ActivityInstanceStatus = z.enum([
  'scheduled',
  'in_progress', 
  'completed',
  'cancelled',
  'postponed',
  'overdue'
]);

export const ActivityType = z.enum([
  'maintenance_preventive',
  'maintenance_corrective',
  'inspection',
  'calibration', 
  'cleaning',
  'audit',
  'training',
  'other'
]);

export const Priority = z.enum([
  'low',
  'medium',
  'high', 
  'critical',
  'emergency'
]);

export interface ActivityInstance {
  id: string;
  tenantId: string;
  scheduleId?: string;
  templateId?: string;
  title: string;
  description?: string;
  activityType: z.infer<typeof ActivityType>;
  status: z.infer<typeof ActivityInstanceStatus>;
  priority: z.infer<typeof Priority>;
  scheduledDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  estimatedDuration?: string; // interval
  actualDuration?: string; // interval
  assignedUserId?: string;
  assignedTeamId?: string;
  completedBy?: string;
  assetId?: string;
  locationId?: string;
  parentInstanceId?: string;
  workOrderNumber?: string;
  isOverdue: boolean;
  overdueBy?: string; // interval
  checklistData?: any;
  attachments: any[];
  comments?: string;
  completionNotes?: string;
  qualityScore?: number; // 1-5 rating
  customerFeedback?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export class ActivityInstanceEntity implements ActivityInstance {
  constructor(
    public id: string,
    public tenantId: string,
    public title: string,
    public activityType: z.infer<typeof ActivityType>,
    public status: z.infer<typeof ActivityInstanceStatus>,
    public priority: z.infer<typeof Priority>,
    public scheduledDate: Date,
    public isOverdue: boolean,
    public attachments: any[],
    public createdAt: Date,
    public updatedAt: Date,
    public createdBy: string,
    public scheduleId?: string,
    public templateId?: string,
    public description?: string,
    public startedAt?: Date,
    public completedAt?: Date,
    public dueDate?: Date,
    public estimatedDuration?: string,
    public actualDuration?: string,
    public assignedUserId?: string,
    public assignedTeamId?: string,
    public completedBy?: string,
    public assetId?: string,
    public locationId?: string,
    public parentInstanceId?: string,
    public workOrderNumber?: string,
    public overdueBy?: string,
    public checklistData?: any,
    public comments?: string,
    public completionNotes?: string,
    public qualityScore?: number,
    public customerFeedback?: string,
    public metadata?: any,
    public updatedBy?: string
  ) {}

  // Domain Methods
  
  public start(userId: string, startTime: Date = new Date()): void {
    if (this.status !== 'scheduled') {
      throw new Error('Activity must be scheduled to start');
    }
    
    this.status = 'in_progress';
    this.startedAt = startTime;
    this.updatedAt = new Date();
    this.updatedBy = userId;
  }

  public complete(
    userId: string, 
    completionNotes?: string, 
    qualityScore?: number,
    completedTime: Date = new Date()
  ): void {
    if (this.status !== 'in_progress') {
      throw new Error('Activity must be in progress to complete');
    }
    
    if (qualityScore && (qualityScore < 1 || qualityScore > 5)) {
      throw new Error('Quality score must be between 1 and 5');
    }

    this.status = 'completed';
    this.completedAt = completedTime;
    this.completedBy = userId;
    this.completionNotes = completionNotes;
    this.qualityScore = qualityScore;
    this.updatedAt = new Date();
    this.updatedBy = userId;

    // Calculate actual duration
    if (this.startedAt) {
      const durationMs = completedTime.getTime() - this.startedAt.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      this.actualDuration = `${hours}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }

  public cancel(userId: string, reason?: string): void {
    if (this.status === 'completed') {
      throw new Error('Cannot cancel completed activity');
    }

    this.status = 'cancelled';
    this.updatedAt = new Date();
    this.updatedBy = userId;
    
    if (reason) {
      this.comments = (this.comments || '') + `\nCancelled: ${reason}`;
    }
  }

  public postpone(userId: string, newScheduledDate: Date, reason?: string): void {
    if (this.status === 'completed') {
      throw new Error('Cannot postpone completed activity');
    }

    this.status = 'postponed';
    this.scheduledDate = newScheduledDate;
    this.updatedAt = new Date();
    this.updatedBy = userId;
    
    if (reason) {
      this.comments = (this.comments || '') + `\nPostponed: ${reason}`;
    }
  }

  public assign(userId: string, assignedUserId?: string, assignedTeamId?: string): void {
    if (!assignedUserId && !assignedTeamId) {
      throw new Error('Must assign to either a user or team');
    }

    this.assignedUserId = assignedUserId;
    this.assignedTeamId = assignedTeamId;
    this.updatedAt = new Date();
    this.updatedBy = userId;
  }

  public updateChecklist(userId: string, checklistData: any): void {
    this.checklistData = checklistData;
    this.updatedAt = new Date();
    this.updatedBy = userId;
  }

  public addAttachment(userId: string, attachment: any): void {
    this.attachments.push({
      ...attachment,
      addedBy: userId,
      addedAt: new Date()
    });
    this.updatedAt = new Date();
    this.updatedBy = userId;
  }

  public addComment(userId: string, comment: string): void {
    const timestamp = new Date().toISOString();
    const newComment = `[${timestamp}] ${comment}`;
    this.comments = this.comments 
      ? `${this.comments}\n${newComment}` 
      : newComment;
    this.updatedAt = new Date();
    this.updatedBy = userId;
  }

  public markAsOverdue(): void {
    if (this.status === 'scheduled' && this.dueDate && new Date() > this.dueDate) {
      this.isOverdue = true;
      const overdueMs = new Date().getTime() - this.dueDate.getTime();
      const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.overdueBy = `${overdueDays} days, ${overdueHours} hours`;
    }
  }

  public escalatePriority(userId: string): void {
    const priorityOrder = ['low', 'medium', 'high', 'critical', 'emergency'];
    const currentIndex = priorityOrder.indexOf(this.priority);
    
    if (currentIndex < priorityOrder.length - 1) {
      this.priority = priorityOrder[currentIndex + 1] as z.infer<typeof Priority>;
      this.updatedAt = new Date();
      this.updatedBy = userId;
      this.addComment(userId, `Priority escalated to ${this.priority}`);
    }
  }

  public isReadyToStart(): boolean {
    return this.status === 'scheduled' && 
           new Date() >= this.scheduledDate &&
           (this.assignedUserId || this.assignedTeamId);
  }

  public getDurationInMinutes(): number | null {
    if (!this.startedAt || !this.completedAt) return null;
    return Math.floor((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
  }

  public getOverdueDays(): number {
    if (!this.isOverdue || !this.dueDate) return 0;
    return Math.floor((new Date().getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  public static create(params: {
    tenantId: string;
    title: string;
    activityType: z.infer<typeof ActivityType>;
    priority: z.infer<typeof Priority>;
    scheduledDate: Date;
    createdBy: string;
    scheduleId?: string;
    templateId?: string;
    description?: string;
    dueDate?: Date;
    estimatedDuration?: string;
    assignedUserId?: string;
    assignedTeamId?: string;
    assetId?: string;
    locationId?: string;
    workOrderNumber?: string;
    metadata?: any;
  }): ActivityInstanceEntity {
    const now = new Date();
    const id = globalThis.crypto.randomUUID();

    return new ActivityInstanceEntity(
      id,
      params.tenantId,
      params.title,
      params.activityType,
      'scheduled',
      params.priority,
      params.scheduledDate,
      false,
      [],
      now,
      now,
      params.createdBy,
      params.scheduleId,
      params.templateId,
      params.description,
      undefined, // startedAt
      undefined, // completedAt
      params.dueDate,
      params.estimatedDuration,
      undefined, // actualDuration
      params.assignedUserId,
      params.assignedTeamId,
      undefined, // completedBy
      params.assetId,
      params.locationId,
      undefined, // parentInstanceId
      params.workOrderNumber,
      undefined, // overdueBy
      undefined, // checklistData
      undefined, // comments
      undefined, // completionNotes
      undefined, // qualityScore
      undefined, // customerFeedback
      params.metadata,
      params.createdBy // updatedBy
    );
  }
}