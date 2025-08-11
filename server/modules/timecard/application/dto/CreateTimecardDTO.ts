
/**
 * CreateTimecardDTO - Clean Architecture Application Layer
 * Follows AGENT_CODING_STANDARDS.md DTO patterns
 */

export class CreateTimecardDTO {
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly date: Date;
  public readonly entries?: Array<{
    clockIn: Date;
    clockOut?: Date;
    location?: string;
    notes?: string;
    breakTime?: number;
  }>;
  public readonly status?: 'open' | 'submitted' | 'approved' | 'rejected';
  public readonly notes?: string;

  constructor(data: {
    userId: string;
    tenantId: string;
    date?: Date;
    entries?: Array<{
      clockIn: Date;
      clockOut?: Date;
      location?: string;
      notes?: string;
      breakTime?: number;
    }>;
    status?: 'open' | 'submitted' | 'approved' | 'rejected';
    notes?: string;
  }) {
    this.userId = data.userId;
    this.tenantId = data.tenantId;
    this.date = data.date || new Date();
    this.entries = data.entries || [];
    this.status = data.status || 'open';
    this.notes = data.notes;
  }

  validate(): boolean {
    return Boolean(
      this.userId &&
      this.tenantId &&
      this.date &&
      this.date instanceof Date &&
      Array.isArray(this.entries)
    );
  }

  toPlainObject() {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      date: this.date,
      entries: this.entries,
      status: this.status,
      notes: this.notes
    };
  }
}
