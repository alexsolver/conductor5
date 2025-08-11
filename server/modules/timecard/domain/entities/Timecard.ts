/**
 * Timecard Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for timecard/journey management
 */

interface TimecardEntry {
  clockIn: Date;
  clockOut: Date | null;
  location: string | null;
  notes: string | null;
  breakTime: number; // in minutes
}

export class Timecard {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private readonly userId: string,
    private readonly date: Date,
    private entries: TimecardEntry[] = [],
    private status: 'open' | 'submitted' | 'approved' | 'rejected' = 'open',
    private totalHours: number = 0,
    private totalBreakTime: number = 0,
    private overtimeHours: number = 0,
    private regularHours: number = 0,
    private approvedById: string | null = null,
    private approvedAt: Date | null = null,
    private submittedAt: Date | null = null,
    private notes: string = '',
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getUserId(): string { return this.userId; }
  getDate(): Date { return this.date; }
  getEntries(): TimecardEntry[] { return [...this.entries]; }
  getStatus(): 'open' | 'submitted' | 'approved' | 'rejected' { return this.status; }
  getTotalHours(): number { return this.totalHours; }
  getTotalBreakTime(): number { return this.totalBreakTime; }
  getOvertimeHours(): number { return this.overtimeHours; }
  getRegularHours(): number { return this.regularHours; }
  getApprovedById(): string | null { return this.approvedById; }
  getApprovedAt(): Date | null { return this.approvedAt; }
  getSubmittedAt(): Date | null { return this.submittedAt; }
  getNotes(): string { return this.notes; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  clockIn(location?: string, notes?: string): void {
    if (this.status !== 'open') {
      throw new Error('Cannot clock in - timecard is not open');
    }

    // Check if already clocked in
    if (this.hasActiveEntry()) {
      throw new Error('Already clocked in - must clock out first');
    }

    this.entries.push({
      clockIn: new Date(),
      clockOut: null,
      location: location || null,
      notes: notes || null,
      breakTime: 0
    });

    this.updatedAt = new Date();
  }

  clockOut(notes?: string): void {
    if (this.status !== 'open') {
      throw new Error('Cannot clock out - timecard is not open');
    }

    const activeEntry = this.getActiveEntry();
    if (!activeEntry) {
      throw new Error('Not currently clocked in');
    }

    activeEntry.clockOut = new Date();
    if (notes) {
      activeEntry.notes = notes;
    }

    this.calculateTotals();
    this.updatedAt = new Date();
  }

  addBreakTime(minutes: number): void {
    if (this.status !== 'open') {
      throw new Error('Cannot add break time - timecard is not open');
    }

    const activeEntry = this.getActiveEntry();
    if (!activeEntry) {
      throw new Error('Not currently clocked in');
    }

    if (minutes < 0) {
      throw new Error('Break time cannot be negative');
    }

    activeEntry.breakTime += minutes;
    this.calculateTotals();
    this.updatedAt = new Date();
  }

  submit(): void {
    if (this.status !== 'open') {
      throw new Error('Timecard is not in open status');
    }

    if (this.hasActiveEntry()) {
      throw new Error('Cannot submit - still clocked in');
    }

    if (this.entries.length === 0) {
      throw new Error('Cannot submit empty timecard');
    }

    this.status = 'submitted';
    this.submittedAt = new Date();
    this.calculateTotals();
    this.updatedAt = new Date();
  }

  approve(approvedById: string): void {
    if (this.status !== 'submitted') {
      throw new Error('Can only approve submitted timecards');
    }

    this.status = 'approved';
    this.approvedById = approvedById;
    this.approvedAt = new Date();
    this.updatedAt = new Date();
  }

  reject(): void {
    if (this.status !== 'submitted') {
      throw new Error('Can only reject submitted timecards');
    }

    this.status = 'rejected';
    this.updatedAt = new Date();
  }

  reopen(): void {
    if (this.status !== 'rejected') {
      throw new Error('Can only reopen rejected timecards');
    }

    this.status = 'open';
    this.updatedAt = new Date();
  }

  addNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  // Private business methods
  private hasActiveEntry(): boolean {
    return this.entries.some(entry => entry.clockOut === null);
  }

  private getActiveEntry(): TimecardEntry | null {
    return this.entries.find(entry => entry.clockOut === null) || null;
  }

  private calculateTotals(): void {
    let totalMinutes = 0;
    let totalBreakMinutes = 0;

    this.entries.forEach(entry => {
      if (entry.clockOut) {
        const workMinutes = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60);
        totalMinutes += workMinutes - entry.breakTime;
        totalBreakMinutes += entry.breakTime;
      }
    });

    this.totalHours = totalMinutes / 60;
    this.totalBreakTime = totalBreakMinutes;

    // Calculate regular vs overtime (assuming 8 hours regular)
    const regularHourLimit = 8;
    this.regularHours = Math.min(this.totalHours, regularHourLimit);
    this.overtimeHours = Math.max(0, this.totalHours - regularHourLimit);
  }

  // Business queries
  isCurrentlyClockedIn(): boolean {
    return this.hasActiveEntry();
  }

  getCurrentSessionDuration(): number {
    const activeEntry = this.getActiveEntry();
    if (!activeEntry) return 0;

    const now = new Date();
    return (now.getTime() - activeEntry.clockIn.getTime()) / (1000 * 60 * 60); // hours
  }

  canSubmit(): boolean {
    return this.status === 'open' && !this.hasActiveEntry() && this.entries.length > 0;
  }

  canApprove(): boolean {
    return this.status === 'submitted';
  }

  canReject(): boolean {
    return this.status === 'submitted';
  }

  canReopen(): boolean {
    return this.status === 'rejected';
  }

  getFirstClockIn(): Date | null {
    if (this.entries.length === 0) return null;
    return this.entries[0].clockIn;
  }

  getLastClockOut(): Date | null {
    const completedEntries = this.entries.filter(entry => entry.clockOut !== null);
    if (completedEntries.length === 0) return null;
    
    return completedEntries.reduce((latest, entry) => {
      return entry.clockOut! > latest ? entry.clockOut! : latest;
    }, completedEntries[0].clockOut!);
  }

  getTotalWorkingTime(): number {
    return this.totalHours;
  }

  getEfficiencyScore(): number {
    // Simple efficiency calculation based on break time ratio
    if (this.totalHours === 0) return 100;
    const breakRatio = (this.totalBreakTime / 60) / this.totalHours;
    return Math.max(0, 100 - (breakRatio * 100));
  }
}