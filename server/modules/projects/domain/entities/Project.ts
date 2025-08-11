/**
 * Project Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for project management
 */

export class Project {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private description: string,
    private status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' = 'planning',
    private priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    private assignedToId: string | null = null,
    private dueDate: Date | null = null,
    private startDate: Date | null = null,
    private completedDate: Date | null = null,
    private progress: number = 0,
    private estimatedHours: number = 0,
    private actualHours: number = 0,
    private budget: number = 0,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getStatus(): 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' { return this.status; }
  getPriority(): 'low' | 'medium' | 'high' | 'critical' { return this.priority; }
  getAssignedToId(): string | null { return this.assignedToId; }
  getDueDate(): Date | null { return this.dueDate; }
  getStartDate(): Date | null { return this.startDate; }
  getCompletedDate(): Date | null { return this.completedDate; }
  getProgress(): number { return this.progress; }
  getEstimatedHours(): number { return this.estimatedHours; }
  getActualHours(): number { return this.actualHours; }
  getBudget(): number { return this.budget; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateBasicInfo(name: string, description: string): void {
    if (!name.trim()) {
      throw new Error('Project name cannot be empty');
    }
    this.name = name.trim();
    this.description = description.trim();
    this.updatedAt = new Date();
  }

  changePriority(priority: 'low' | 'medium' | 'high' | 'critical'): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }

  assignTo(userId: string): void {
    this.assignedToId = userId;
    this.updatedAt = new Date();
  }

  unassign(): void {
    this.assignedToId = null;
    this.updatedAt = new Date();
  }

  setDueDate(date: Date): void {
    if (date < new Date()) {
      throw new Error('Due date cannot be in the past');
    }
    this.dueDate = date;
    this.updatedAt = new Date();
  }

  start(): void {
    if (this.status !== 'planning') {
      throw new Error('Project can only be started from planning status');
    }
    this.status = 'active';
    this.startDate = new Date();
    this.updatedAt = new Date();
  }

  pause(): void {
    if (this.status !== 'active') {
      throw new Error('Only active projects can be paused');
    }
    this.status = 'on_hold';
    this.updatedAt = new Date();
  }

  resume(): void {
    if (this.status !== 'on_hold') {
      throw new Error('Only paused projects can be resumed');
    }
    this.status = 'active';
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.status !== 'active') {
      throw new Error('Only active projects can be completed');
    }
    this.status = 'completed';
    this.completedDate = new Date();
    this.progress = 100;
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status === 'completed') {
      throw new Error('Completed projects cannot be cancelled');
    }
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  updateProgress(progress: number): void {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    this.progress = progress;
    this.updatedAt = new Date();

    // Auto-complete if progress reaches 100%
    if (progress === 100 && this.status === 'active') {
      this.complete();
    }
  }

  updateHours(estimatedHours: number, actualHours?: number): void {
    if (estimatedHours < 0) {
      throw new Error('Estimated hours cannot be negative');
    }
    this.estimatedHours = estimatedHours;
    
    if (actualHours !== undefined) {
      if (actualHours < 0) {
        throw new Error('Actual hours cannot be negative');
      }
      this.actualHours = actualHours;
    }
    
    this.updatedAt = new Date();
  }

  addActualHours(hours: number): void {
    if (hours <= 0) {
      throw new Error('Hours to add must be positive');
    }
    this.actualHours += hours;
    this.updatedAt = new Date();
  }

  setBudget(budget: number): void {
    if (budget < 0) {
      throw new Error('Budget cannot be negative');
    }
    this.budget = budget;
    this.updatedAt = new Date();
  }

  // Business queries
  isOverdue(): boolean {
    if (!this.dueDate || this.status === 'completed') return false;
    return new Date() > this.dueDate;
  }

  isDueToday(): boolean {
    if (!this.dueDate) return false;
    const today = new Date();
    const dueDay = this.dueDate;
    return (
      today.getDate() === dueDay.getDate() &&
      today.getMonth() === dueDay.getMonth() &&
      today.getFullYear() === dueDay.getFullYear()
    );
  }

  isDueSoon(days: number = 7): boolean {
    if (!this.dueDate || this.status === 'completed') return false;
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + days);
    return this.dueDate <= warningDate && this.dueDate >= today;
  }

  getEfficiencyRatio(): number {
    if (this.estimatedHours === 0) return 0;
    return this.actualHours / this.estimatedHours;
  }

  isOnTrack(): boolean {
    if (this.status !== 'active' || !this.startDate || !this.dueDate) return true;
    
    const totalDuration = this.dueDate.getTime() - this.startDate.getTime();
    const elapsed = Date.now() - this.startDate.getTime();
    const expectedProgress = (elapsed / totalDuration) * 100;
    
    return this.progress >= expectedProgress * 0.8; // 80% tolerance
  }

  getDaysRemaining(): number | null {
    if (!this.dueDate || this.status === 'completed') return null;
    const diffMs = this.dueDate.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  getTotalDuration(): number | null {
    if (!this.startDate || !this.dueDate) return null;
    const diffMs = this.dueDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}