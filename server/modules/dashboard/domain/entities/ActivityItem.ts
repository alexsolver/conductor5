/**
 * ActivityItem Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for activity tracking
 */

export class ActivityItem {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private readonly type: string,
    private description: string,
    private readonly userId: string,
    private readonly entityType: string,
    private readonly entityId: string,
    private readonly timestamp: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getType(): string { return this.type; }
  getDescription(): string { return this.description; }
  getUserId(): string { return this.userId; }
  getEntityType(): string { return this.entityType; }
  getEntityId(): string { return this.entityId; }
  getTimestamp(): Date { return this.timestamp; }

  // Business methods
  updateDescription(description: string): void {
    this.description = description;
  }

  isRecent(hoursThreshold: number = 24): boolean {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hoursThreshold);
    return this.timestamp > hoursAgo;
  }

  getActivityAge(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return this.timestamp.toLocaleDateString();
  }

  getPriority(): 'low' | 'medium' | 'high' {
    switch (this.type) {
      case 'ticket_created':
      case 'ticket_escalated':
        return 'high';
      case 'ticket_updated':
      case 'ticket_assigned':
        return 'medium';
      default:
        return 'low';
    }
  }
}