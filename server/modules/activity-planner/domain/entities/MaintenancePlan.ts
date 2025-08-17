/**
 * MaintenancePlan Entity - Entidade de domínio para planos de manutenção
 * Define estratégias e frequências de manutenção preventiva
 * Seguindo padrões Clean Architecture e 1qa.md
 */

export interface MaintenanceTask {
  id: string;
  name: string;
  description?: string;
  estimatedDuration: number; // em minutos
  requiredSkillsJson: string[];
  requiredCertificationsJson: string[];
  checklistJson: ChecklistItem[];
  requiredPartsJson?: MaintenancePart[];
  sequence: number;
  isMandatory: boolean;
}

export interface ChecklistItem {
  id: string;
  description: string;
  type: 'boolean' | 'numeric' | 'text' | 'photo' | 'signature';
  required: boolean;
  options?: string[]; // para select/radio
  minValue?: number;
  maxValue?: number;
  unit?: string;
}

export interface MaintenancePart {
  materialServiceId: string;
  quantity: number;
  isOptional: boolean;
}

export interface MaintenanceFrequency {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'usage_based' | 'condition_based';
  interval: number;
  unit?: 'hours' | 'days' | 'weeks' | 'months' | 'km' | 'cycles' | 'runtime_hours';
  meterName?: string; // para usage_based
  threshold?: number; // para condition_based
}

export interface MaintenancePlan {
  id: string;
  tenantId: string;
  assetId: string;
  name: string;
  description?: string;
  triggerType: 'time' | 'meter' | 'condition';
  frequency: MaintenanceFrequency;
  tasksTemplateJson: MaintenanceTask[];
  slaPolicy?: string; // referência ao SLA policy
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // em minutos
  leadTime: number; // antecedência em horas
  seasonalAdjustments?: Record<string, number>; // ajustes por estação
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  lastGeneratedAt?: Date;
  nextScheduledAt?: Date;
  generationCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface InsertMaintenancePlan {
  tenantId: string;
  assetId: string;
  name: string;
  description?: string;
  triggerType: 'time' | 'meter' | 'condition';
  frequency: MaintenanceFrequency;
  tasksTemplateJson: MaintenanceTask[];
  slaPolicy?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  leadTime: number;
  seasonalAdjustments?: Record<string, number>;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdBy: string;
}

export class MaintenancePlanEntity {
  constructor(private plan: MaintenancePlan) {}

  getId(): string {
    return this.plan.id;
  }

  getTenantId(): string {
    return this.plan.tenantId;
  }

  getAssetId(): string {
    return this.plan.assetId;
  }

  getName(): string {
    return this.plan.name;
  }

  getTriggerType(): 'time' | 'meter' | 'condition' {
    return this.plan.triggerType;
  }

  getFrequency(): MaintenanceFrequency {
    return this.plan.frequency;
  }

  getTasks(): MaintenanceTask[] {
    return this.plan.tasksTemplateJson;
  }

  getPriority(): 'low' | 'medium' | 'high' | 'critical' {
    return this.plan.priority;
  }

  getEstimatedDuration(): number {
    return this.plan.estimatedDuration;
  }

  getLeadTime(): number {
    return this.plan.leadTime;
  }

  isActive(): boolean {
    return this.plan.isActive;
  }

  isEffective(date: Date = new Date()): boolean {
    if (!this.plan.isActive) return false;
    if (date < this.plan.effectiveFrom) return false;
    if (this.plan.effectiveTo && date > this.plan.effectiveTo) return false;
    return true;
  }

  shouldGenerate(currentDate: Date = new Date(), currentMeterValue?: number): boolean {
    if (!this.isEffective(currentDate)) return false;

    switch (this.plan.triggerType) {
      case 'time':
        return this.shouldGenerateByTime(currentDate);
      case 'meter':
        return this.shouldGenerateByMeter(currentMeterValue);
      case 'condition':
        return this.shouldGenerateByCondition();
      default:
        return false;
    }
  }

  private shouldGenerateByTime(currentDate: Date): boolean {
    if (!this.plan.nextScheduledAt) return true;
    return currentDate >= this.plan.nextScheduledAt;
  }

  private shouldGenerateByMeter(currentValue?: number): boolean {
    if (!currentValue || !this.plan.frequency.threshold) return false;
    return currentValue >= this.plan.frequency.threshold;
  }

  private shouldGenerateByCondition(): boolean {
    // Lógica para condições específicas seria implementada aqui
    // Por exemplo, temperatura, vibração, etc.
    return false;
  }

  calculateNextScheduledDate(fromDate: Date = new Date()): Date {
    const frequency = this.plan.frequency;
    const nextDate = new Date(fromDate);

    switch (frequency.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + frequency.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (frequency.interval * 7));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + frequency.interval);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (frequency.interval * 3));
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + frequency.interval);
        break;
      default:
        // Para usage_based e condition_based, mantém a data atual
        break;
    }

    return nextDate;
  }

  updateLastGeneration(date: Date): void {
    this.plan.lastGeneratedAt = date;
    this.plan.nextScheduledAt = this.calculateNextScheduledDate(date);
    this.plan.generationCount += 1;
    this.plan.updatedAt = new Date();
  }

  deactivate(): void {
    this.plan.isActive = false;
    this.plan.updatedAt = new Date();
  }

  activate(): void {
    this.plan.isActive = true;
    this.plan.updatedAt = new Date();
  }

  toPlainObject(): MaintenancePlan {
    return { ...this.plan };
  }
}