/**
 * SLA Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for Service Level Agreement management
 */

interface SLAMetric {
  name: string;
  target: number; // target value (e.g., 24 for hours, 95 for percentage)
  unit: 'hours' | 'minutes' | 'days' | 'percentage' | 'count';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface SLABreach {
  metricName: string;
  breachDate: Date;
  targetValue: number;
  actualValue: number;
  severity: 'minor' | 'major' | 'critical';
  resolved: boolean;
  resolvedAt?: Date;
}

interface EscalationRule {
  id: string;
  condition: 'time_exceeded' | 'breach_threshold' | 'multiple_breaches';
  threshold: number;
  action: 'notify' | 'escalate' | 'auto_assign';
  recipients: string[]; // user IDs
  delayMinutes: number;
}

export class SLA {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private description: string,
    private category: 'support' | 'development' | 'maintenance' | 'custom' = 'support',
    private priority: 'critical' | 'high' | 'medium' | 'low' = 'medium',
    private metrics: SLAMetric[] = [],
    private escalationRules: EscalationRule[] = [],
    private breaches: SLABreach[] = [],
    private isActive: boolean = true,
    private effectiveFrom: Date = new Date(),
    private effectiveTo: Date | null = null,
    private clientIds: string[] = [], // which clients this SLA applies to
    private serviceTypes: string[] = [], // which service types
    private metadata: Record<string, any> = {},
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getCategory(): 'support' | 'development' | 'maintenance' | 'custom' { return this.category; }
  getPriority(): 'critical' | 'high' | 'medium' | 'low' { return this.priority; }
  getMetrics(): SLAMetric[] { return [...this.metrics]; }
  getEscalationRules(): EscalationRule[] { return [...this.escalationRules]; }
  getBreaches(): SLABreach[] { return [...this.breaches]; }
  isActive(): boolean { return this.isActive; }
  getEffectiveFrom(): Date { return this.effectiveFrom; }
  getEffectiveTo(): Date | null { return this.effectiveTo; }
  getClientIds(): string[] { return [...this.clientIds]; }
  getServiceTypes(): string[] { return [...this.serviceTypes]; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateBasicInfo(name: string, description: string, category?: 'support' | 'development' | 'maintenance' | 'custom'): void {
    if (!name.trim()) {
      throw new Error('SLA name cannot be empty');
    }
    
    this.name = name.trim();
    this.description = description.trim();
    
    if (category) {
      this.category = category;
    }
    
    this.updatedAt = new Date();
  }

  addMetric(metric: SLAMetric): void {
    // Check for duplicate metric name
    if (this.metrics.some(m => m.name === metric.name)) {
      throw new Error('Metric with this name already exists');
    }
    
    if (metric.target <= 0) {
      throw new Error('Metric target must be greater than 0');
    }
    
    this.metrics.push(metric);
    this.updatedAt = new Date();
  }

  updateMetric(metricName: string, updates: Partial<SLAMetric>): void {
    const metricIndex = this.metrics.findIndex(m => m.name === metricName);
    if (metricIndex === -1) {
      throw new Error('Metric not found');
    }
    
    if (updates.target && updates.target <= 0) {
      throw new Error('Metric target must be greater than 0');
    }
    
    this.metrics[metricIndex] = { ...this.metrics[metricIndex], ...updates };
    this.updatedAt = new Date();
  }

  removeMetric(metricName: string): void {
    this.metrics = this.metrics.filter(m => m.name !== metricName);
    // Also remove related breaches
    this.breaches = this.breaches.filter(b => b.metricName !== metricName);
    this.updatedAt = new Date();
  }

  addEscalationRule(rule: EscalationRule): void {
    // Check for duplicate rule ID
    if (this.escalationRules.some(r => r.id === rule.id)) {
      throw new Error('Escalation rule with this ID already exists');
    }
    
    if (rule.threshold <= 0) {
      throw new Error('Escalation threshold must be greater than 0');
    }
    
    if (rule.delayMinutes < 0) {
      throw new Error('Delay minutes cannot be negative');
    }
    
    this.escalationRules.push(rule);
    this.updatedAt = new Date();
  }

  updateEscalationRule(ruleId: string, updates: Partial<EscalationRule>): void {
    const ruleIndex = this.escalationRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error('Escalation rule not found');
    }
    
    if (updates.threshold && updates.threshold <= 0) {
      throw new Error('Escalation threshold must be greater than 0');
    }
    
    this.escalationRules[ruleIndex] = { ...this.escalationRules[ruleIndex], ...updates };
    this.updatedAt = new Date();
  }

  removeEscalationRule(ruleId: string): void {
    this.escalationRules = this.escalationRules.filter(r => r.id !== ruleId);
    this.updatedAt = new Date();
  }

  recordBreach(breach: SLABreach): void {
    // Validate metric exists
    if (!this.metrics.some(m => m.name === breach.metricName)) {
      throw new Error('Cannot record breach for non-existent metric');
    }
    
    this.breaches.push(breach);
    this.updatedAt = new Date();
  }

  resolveBreach(metricName: string, breachDate: Date): void {
    const breach = this.breaches.find(b => 
      b.metricName === metricName && 
      b.breachDate.getTime() === breachDate.getTime() &&
      !b.resolved
    );
    
    if (!breach) {
      throw new Error('Unresolved breach not found');
    }
    
    breach.resolved = true;
    breach.resolvedAt = new Date();
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  setEffectivePeriod(from: Date, to?: Date): void {
    if (to && to <= from) {
      throw new Error('Effective to date must be after from date');
    }
    
    this.effectiveFrom = from;
    this.effectiveTo = to || null;
    this.updatedAt = new Date();
  }

  addClient(clientId: string): void {
    if (!this.clientIds.includes(clientId)) {
      this.clientIds.push(clientId);
      this.updatedAt = new Date();
    }
  }

  removeClient(clientId: string): void {
    this.clientIds = this.clientIds.filter(id => id !== clientId);
    this.updatedAt = new Date();
  }

  addServiceType(serviceType: string): void {
    if (!this.serviceTypes.includes(serviceType)) {
      this.serviceTypes.push(serviceType);
      this.updatedAt = new Date();
    }
  }

  removeServiceType(serviceType: string): void {
    this.serviceTypes = this.serviceTypes.filter(type => type !== serviceType);
    this.updatedAt = new Date();
  }

  changePriority(priority: 'critical' | 'high' | 'medium' | 'low'): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }

  // Business queries
  isEffective(date: Date = new Date()): boolean {
    if (!this.isActive) return false;
    
    const effectiveFromOk = date >= this.effectiveFrom;
    const effectiveToOk = !this.effectiveTo || date <= this.effectiveTo;
    
    return effectiveFromOk && effectiveToOk;
  }

  getMetric(metricName: string): SLAMetric | null {
    return this.metrics.find(m => m.name === metricName) || null;
  }

  hasMetric(metricName: string): boolean {
    return this.metrics.some(m => m.name === metricName);
  }

  getUnresolvedBreaches(): SLABreach[] {
    return this.breaches.filter(b => !b.resolved);
  }

  getResolvedBreaches(): SLABreach[] {
    return this.breaches.filter(b => b.resolved);
  }

  getCriticalBreaches(): SLABreach[] {
    return this.breaches.filter(b => b.severity === 'critical');
  }

  getBreachCount(period?: { from: Date; to: Date }): number {
    let breaches = this.breaches;
    
    if (period) {
      breaches = breaches.filter(b => 
        b.breachDate >= period.from && b.breachDate <= period.to
      );
    }
    
    return breaches.length;
  }

  getBreachRate(period?: { from: Date; to: Date }): number {
    // Breach rate calculation would depend on total opportunities
    // This is a simplified version
    const breachCount = this.getBreachCount(period);
    const totalMetrics = this.metrics.length;
    
    if (totalMetrics === 0) return 0;
    
    // Simple calculation - would be more complex in real implementation
    return (breachCount / totalMetrics) * 100;
  }

  getComplianceScore(): number {
    const totalBreaches = this.breaches.length;
    const unresolvedBreaches = this.getUnresolvedBreaches().length;
    
    if (totalBreaches === 0) return 100; // Perfect compliance
    
    const resolvedRate = ((totalBreaches - unresolvedBreaches) / totalBreaches) * 100;
    const breachPenalty = Math.min(totalBreaches * 5, 50); // Max 50% penalty
    
    return Math.max(0, resolvedRate - breachPenalty);
  }

  appliesTo(clientId: string, serviceType?: string): boolean {
    // Check if SLA applies to specific client
    const clientMatch = this.clientIds.length === 0 || this.clientIds.includes(clientId);
    
    // Check if SLA applies to specific service type
    const serviceMatch = !serviceType || this.serviceTypes.length === 0 || this.serviceTypes.includes(serviceType);
    
    return clientMatch && serviceMatch && this.isEffective();
  }

  shouldEscalate(metricName: string, actualValue: number, timeSinceCreation?: number): EscalationRule[] {
    const metric = this.getMetric(metricName);
    if (!metric) return [];
    
    const triggeredRules: EscalationRule[] = [];
    
    this.escalationRules.forEach(rule => {
      let shouldTrigger = false;
      
      switch (rule.condition) {
        case 'time_exceeded':
          shouldTrigger = timeSinceCreation !== undefined && timeSinceCreation > rule.threshold;
          break;
        case 'breach_threshold':
          // Check if actual value breaches target by threshold percentage
          const thresholdValue = metric.target * (1 + rule.threshold / 100);
          shouldTrigger = actualValue > thresholdValue;
          break;
        case 'multiple_breaches':
          // Count recent breaches for this metric
          const recentBreaches = this.breaches.filter(b => 
            b.metricName === metricName && 
            !b.resolved &&
            b.breachDate > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          );
          shouldTrigger = recentBreaches.length >= rule.threshold;
          break;
      }
      
      if (shouldTrigger) {
        triggeredRules.push(rule);
      }
    });
    
    return triggeredRules;
  }

  getCriticalMetrics(): SLAMetric[] {
    return this.metrics.filter(m => m.priority === 'critical');
  }

  getAverageResolutionTime(): number | null {
    const resolvedBreaches = this.getResolvedBreaches();
    if (resolvedBreaches.length === 0) return null;
    
    const totalResolutionTime = resolvedBreaches.reduce((sum, breach) => {
      if (breach.resolvedAt) {
        return sum + (breach.resolvedAt.getTime() - breach.breachDate.getTime());
      }
      return sum;
    }, 0);
    
    return totalResolutionTime / resolvedBreaches.length; // milliseconds
  }

  isCritical(): boolean {
    return this.priority === 'critical';
  }

  hasActiveBreaches(): boolean {
    return this.getUnresolvedBreaches().length > 0;
  }

  getNextReviewDate(): Date {
    // Calculate next review based on priority
    const days = this.priority === 'critical' ? 7 : 
                 this.priority === 'high' ? 14 : 
                 this.priority === 'medium' ? 30 : 90;
    
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}