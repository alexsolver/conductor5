
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

  // CLEANED: Factory methods removed - handled by repository layer
  // Domain entities focus purely on business logic
}
