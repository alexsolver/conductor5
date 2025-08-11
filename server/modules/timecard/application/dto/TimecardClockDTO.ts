
/**
 * TimecardClockDTO - Clean Architecture Application Layer
 * Follows AGENT_CODING_STANDARDS.md DTO patterns
 */

export class TimecardClockDTO {
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly location?: string;
  public readonly notes?: string;
  public readonly timestamp: Date;

  constructor(data: {
    userId: string;
    tenantId: string;
    location?: string;
    notes?: string;
    timestamp: Date;
  }) {
    this.userId = data.userId;
    this.tenantId = data.tenantId;
    this.location = data.location;
    this.notes = data.notes;
    this.timestamp = data.timestamp;
  }

  validate(): boolean {
    return Boolean(
      this.userId &&
      this.tenantId &&
      this.timestamp &&
      this.timestamp instanceof Date
    );
  }

  toPlainObject() {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      location: this.location,
      notes: this.notes,
      timestamp: this.timestamp
    };
  }
}
