
export class DashboardMetric {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly value: number,
    public readonly unit: string,
    public readonly category: string,
    public readonly createdAt: Date,
    public readonly metadata?: Record<string, any>
  ) {}

  // Factory method removed - should be handled by repository or service layer
  static createRemoved(data: Omit<DashboardMetric, 'id' | 'createdAt'>): DashboardMetric {
    return new DashboardMetric(
      crypto.randomUUID(),
      data.name,
      data.value,
      data.unit,
      data.category,
      new Date(),
      data.metadata
    );
  }
}
