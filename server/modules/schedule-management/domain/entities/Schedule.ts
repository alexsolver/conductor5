/**
 * Schedule Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for schedule/agenda management
 */

interface ScheduleAttendee {
  userId: string;
  name: string;
  email: string;
  role: 'organizer' | 'required' | 'optional';
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

interface Recurrence {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // every N days/weeks/months/years
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  endDate?: Date;
  occurrences?: number; // max occurrences
}

export class Schedule {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private title: string,
    private description: string,
    private startTime: Date,
    private endTime: Date,
    private location: string = '',
    private attendees: ScheduleAttendee[] = [],
    private recurrence: Recurrence | null = null,
    private status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' = 'scheduled',
    private type: 'meeting' | 'task' | 'reminder' | 'event' = 'meeting',
    private priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    private isAllDay: boolean = false,
    private reminders: number[] = [], // minutes before start
    private metadata: Record<string, any> = {},
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    this.validateTimes();
  }

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getTitle(): string { return this.title; }
  getDescription(): string { return this.description; }
  getStartTime(): Date { return this.startTime; }
  getEndTime(): Date { return this.endTime; }
  getLocation(): string { return this.location; }
  getAttendees(): ScheduleAttendee[] { return [...this.attendees]; }
  getRecurrence(): Recurrence | null { return this.recurrence; }
  getStatus(): 'scheduled' | 'in_progress' | 'completed' | 'cancelled' { return this.status; }
  getType(): 'meeting' | 'task' | 'reminder' | 'event' { return this.type; }
  getPriority(): 'low' | 'medium' | 'high' | 'critical' { return this.priority; }
  isAllDayEvent(): boolean { return this.isAllDay; }
  getReminders(): number[] { return [...this.reminders]; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateBasicInfo(title: string, description: string): void {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error('Cannot update completed or cancelled schedule');
    }
    if (!title.trim()) {
      throw new Error('Title cannot be empty');
    }
    
    this.title = title.trim();
    this.description = description.trim();
    this.updatedAt = new Date();
  }

  updateTimes(startTime: Date, endTime: Date, isAllDay: boolean = false): void {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error('Cannot update times for completed or cancelled schedule');
    }
    
    this.startTime = startTime;
    this.endTime = endTime;
    this.isAllDay = isAllDay;
    this.validateTimes();
    this.updatedAt = new Date();
  }

  updateLocation(location: string): void {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error('Cannot update location for completed or cancelled schedule');
    }
    
    this.location = location;
    this.updatedAt = new Date();
  }

  addAttendee(attendee: ScheduleAttendee): void {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error('Cannot add attendees to completed or cancelled schedule');
    }
    
    // Check for duplicate
    const exists = this.attendees.some(a => a.userId === attendee.userId);
    if (exists) {
      throw new Error('Attendee already exists');
    }
    
    this.attendees.push(attendee);
    this.updatedAt = new Date();
  }

  removeAttendee(userId: string): void {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error('Cannot remove attendees from completed or cancelled schedule');
    }
    
    this.attendees = this.attendees.filter(a => a.userId !== userId);
    this.updatedAt = new Date();
  }

  updateAttendeeStatus(userId: string, status: 'pending' | 'accepted' | 'declined' | 'tentative'): void {
    const attendee = this.attendees.find(a => a.userId === userId);
    if (!attendee) {
      throw new Error('Attendee not found');
    }
    
    attendee.status = status;
    this.updatedAt = new Date();
  }

  setRecurrence(recurrence: Recurrence): void {
    if (this.status === 'in_progress' || this.status === 'completed') {
      throw new Error('Cannot set recurrence for in-progress or completed schedule');
    }
    
    this.recurrence = recurrence;
    this.updatedAt = new Date();
  }

  removeRecurrence(): void {
    this.recurrence = null;
    this.updatedAt = new Date();
  }

  start(): void {
    if (this.status !== 'scheduled') {
      throw new Error('Can only start scheduled events');
    }
    
    this.status = 'in_progress';
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.status !== 'in_progress' && this.status !== 'scheduled') {
      throw new Error('Can only complete in-progress or scheduled events');
    }
    
    this.status = 'completed';
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status === 'completed') {
      throw new Error('Cannot cancel completed event');
    }
    
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  changePriority(priority: 'low' | 'medium' | 'high' | 'critical'): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }

  addReminder(minutesBefore: number): void {
    if (minutesBefore < 0) {
      throw new Error('Reminder time cannot be negative');
    }
    
    if (!this.reminders.includes(minutesBefore)) {
      this.reminders.push(minutesBefore);
      this.reminders.sort((a, b) => b - a); // Sort descending
      this.updatedAt = new Date();
    }
  }

  removeReminder(minutesBefore: number): void {
    this.reminders = this.reminders.filter(r => r !== minutesBefore);
    this.updatedAt = new Date();
  }

  // Private validation
  private validateTimes(): void {
    if (!this.isAllDay && this.endTime <= this.startTime) {
      throw new Error('End time must be after start time');
    }
    
    if (this.startTime < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      // Allow scheduling up to 24 hours in the past for flexibility
      throw new Error('Start time cannot be more than 24 hours in the past');
    }
  }

  // Business queries
  getDuration(): number {
    if (this.isAllDay) return 24 * 60; // minutes in a day
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60); // minutes
  }

  isHappening(): boolean {
    if (this.status !== 'in_progress') return false;
    const now = new Date();
    return now >= this.startTime && now <= this.endTime;
  }

  isPast(): boolean {
    return new Date() > this.endTime;
  }

  isUpcoming(): boolean {
    return new Date() < this.startTime;
  }

  isToday(): boolean {
    const today = new Date();
    const eventDate = this.startTime;
    return (
      today.getDate() === eventDate.getDate() &&
      today.getMonth() === eventDate.getMonth() &&
      today.getFullYear() === eventDate.getFullYear()
    );
  }

  getAcceptedAttendees(): ScheduleAttendee[] {
    return this.attendees.filter(a => a.status === 'accepted');
  }

  getPendingAttendees(): ScheduleAttendee[] {
    return this.attendees.filter(a => a.status === 'pending');
  }

  getAttendanceRate(): number {
    if (this.attendees.length === 0) return 100;
    const acceptedCount = this.getAcceptedAttendees().length;
    return (acceptedCount / this.attendees.length) * 100;
  }

  hasConflictWith(other: Schedule): boolean {
    // Check if there's any time overlap
    return (
      this.startTime < other.endTime && 
      this.endTime > other.startTime &&
      this.id !== other.id
    );
  }

  getNextOccurrence(): Date | null {
    if (!this.recurrence) return null;
    
    const now = new Date();
    let nextDate = new Date(this.startTime);
    
    while (nextDate <= now) {
      switch (this.recurrence.pattern) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + this.recurrence.interval);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + (this.recurrence.interval * 7));
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + this.recurrence.interval);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + this.recurrence.interval);
          break;
      }
    }
    
    // Check if within end date or occurrence limits
    if (this.recurrence.endDate && nextDate > this.recurrence.endDate) {
      return null;
    }
    
    return nextDate;
  }

  shouldSendReminder(minutesBefore: number): boolean {
    if (!this.reminders.includes(minutesBefore)) return false;
    
    const reminderTime = new Date(this.startTime.getTime() - (minutesBefore * 60 * 1000));
    const now = new Date();
    
    // Send reminder if we're within 1 minute of the reminder time
    return Math.abs(now.getTime() - reminderTime.getTime()) <= 60000;
  }
}