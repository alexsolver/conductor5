/**
 * MaintenancePlan Entity - Entidade de domínio para planos de manutenção
 * Representa planos preventivos de manutenção com triggers e frequências
 * Seguindo padrões Clean Architecture e 1qa.md
 */

export interface MaintenanceFrequency {
  type: 'daily' | 'weekly' | 'monthly' | 'usage_based' | 'condition_based';
  interval: number;
  unit?: 'hours' | 'km' | 'cycles' | 'days';
  weekdays?: number[]; // Para weekly (0=domingo, 1=segunda, etc.)
  monthDay?: number; // Para monthly (dia do mês)
}

export interface MaintenanceTask {
  id: string;
  sequence: number;
  name: string;
  description?: string;
  estimatedDuration: number; // em minutos
  requiredSkills?: string[];
  requiredCertifications?: string[];
  checklist?: MaintenanceChecklistItem[];
  requiredParts?: RequiredPart[];
  dependencies?: string[]; // IDs de outras tarefas
  isOptional: boolean;
  safetyRequirements?: string[];
}

export interface MaintenanceChecklistItem {
  id: string;
  description: string;
  type: 'check' | 'measurement' | 'photo' | 'signature';
  required: boolean;
  expectedValue?: string | number;
  tolerance?: number;
  unit?: string;
}

export interface RequiredPart {
  materialServiceId: string;
  quantity: number;
  isOptional: boolean;
  alternativeIds?: string[];
}

export interface SeasonalAdjustment {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  frequencyMultiplier: number; // 1.0 = normal, >1.0 = mais frequente
  additionalTasks?: string[]; // IDs de tarefas extras para a estação
}

export interface MaintenancePlan {
  id: string;
  tenantId: string;
  assetId: string;
  name: string;
  description?: string;
  triggerType: 'time' | 'meter' | 'condition';
  frequencyJson: MaintenanceFrequency;
  tasksTemplateJson: MaintenanceTask[];
  slaPolicy?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // em minutos (soma das tarefas)
  leadTime: number; // antecedência em horas
  seasonalAdjustmentsJson?: SeasonalAdjustment[];
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
  frequencyJson: MaintenanceFrequency;
  tasksTemplateJson: MaintenanceTask[];
  slaPolicy?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  leadTime?: number;
  seasonalAdjustmentsJson?: SeasonalAdjustment[];
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
    return this.plan.frequencyJson;
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

  isActive(): boolean {
    return this.plan.isActive;
  }

  isEffective(date: Date = new Date()): boolean {
    if (!this.plan.isActive) return false;
    if (date < this.plan.effectiveFrom) return false;
    if (this.plan.effectiveTo && date > this.plan.effectiveTo) return false;
    return true;
  }

  shouldGenerateWorkOrder(currentDate: Date = new Date()): boolean {
    if (!this.isEffective(currentDate)) return false;
    if (!this.plan.nextScheduledAt) return true; // Primeiro agendamento
    return currentDate >= this.plan.nextScheduledAt;
  }

  calculateNextScheduleDate(fromDate: Date = new Date()): Date {
    const frequency = this.plan.frequencyJson;
    const nextDate = new Date(fromDate);

    switch (frequency.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + frequency.interval);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (frequency.interval * 7));
        break;

      case 'monthly':
        if (frequency.monthDay) {
          nextDate.setMonth(nextDate.getMonth() + frequency.interval);
          nextDate.setDate(frequency.monthDay);
        } else {
          nextDate.setMonth(nextDate.getMonth() + frequency.interval);
        }
        break;

      case 'usage_based':
        // Para base de uso, precisa ser calculado externamente baseado em medidores
        throw new Error('Usage-based scheduling requires external meter calculation');

      case 'condition_based':
        // Para base de condição, precisa ser calculado externamente baseado em sensores/IoT
        throw new Error('Condition-based scheduling requires external condition evaluation');

      default:
        throw new Error(`Unsupported frequency type: ${frequency.type}`);
    }

    return nextDate;
  }

  applySeasonalAdjustment(baseDate: Date): Date {
    if (!this.plan.seasonalAdjustmentsJson || this.plan.seasonalAdjustmentsJson.length === 0) {
      return baseDate;
    }

    const month = baseDate.getMonth();
    let season: 'spring' | 'summer' | 'fall' | 'winter';

    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    const seasonalAdjustment = this.plan.seasonalAdjustmentsJson.find(adj => adj.season === season);
    if (!seasonalAdjustment || seasonalAdjustment.frequencyMultiplier === 1.0) {
      return baseDate;
    }

    // Aplicar multiplicador de frequência
    const frequency = this.plan.frequencyJson;
    const adjustedInterval = Math.round(frequency.interval / seasonalAdjustment.frequencyMultiplier);
    
    const adjustedDate = new Date(baseDate);
    if (frequency.type === 'daily') {
      adjustedDate.setDate(adjustedDate.getDate() - (frequency.interval - adjustedInterval));
    } else if (frequency.type === 'weekly') {
      adjustedDate.setDate(adjustedDate.getDate() - ((frequency.interval - adjustedInterval) * 7));
    } else if (frequency.type === 'monthly') {
      adjustedDate.setMonth(adjustedDate.getMonth() - (frequency.interval - adjustedInterval));
    }

    return adjustedDate;
  }

  getTasksBySequence(): MaintenanceTask[] {
    return [...this.plan.tasksTemplateJson].sort((a, b) => a.sequence - b.sequence);
  }

  getCriticalTasks(): MaintenanceTask[] {
    return this.plan.tasksTemplateJson.filter(task => !task.isOptional);
  }

  getTotalEstimatedDuration(): number {
    return this.plan.tasksTemplateJson.reduce((total, task) => total + task.estimatedDuration, 0);
  }

  getRequiredSkills(): string[] {
    const skills = new Set<string>();
    this.plan.tasksTemplateJson.forEach(task => {
      task.requiredSkills?.forEach(skill => skills.add(skill));
    });
    return Array.from(skills);
  }

  getRequiredCertifications(): string[] {
    const certifications = new Set<string>();
    this.plan.tasksTemplateJson.forEach(task => {
      task.requiredCertifications?.forEach(cert => certifications.add(cert));
    });
    return Array.from(certifications);
  }

  getRequiredParts(): RequiredPart[] {
    const parts: RequiredPart[] = [];
    this.plan.tasksTemplateJson.forEach(task => {
      task.requiredParts?.forEach(part => parts.push(part));
    });
    return parts;
  }

  updateNextScheduleDate(): void {
    const nextDate = this.calculateNextScheduleDate();
    const adjustedDate = this.applySeasonalAdjustment(nextDate);
    this.plan.nextScheduledAt = adjustedDate;
    this.plan.updatedAt = new Date();
  }

  markAsGenerated(): void {
    this.plan.lastGeneratedAt = new Date();
    this.plan.generationCount += 1;
    this.updateNextScheduleDate();
  }

  activate(): void {
    this.plan.isActive = true;
    this.plan.updatedAt = new Date();
  }

  deactivate(): void {
    this.plan.isActive = false;
    this.plan.updatedAt = new Date();
  }

  updateEstimatedDuration(): void {
    this.plan.estimatedDuration = this.getTotalEstimatedDuration();
    this.plan.updatedAt = new Date();
  }

  toPlainObject(): MaintenancePlan {
    return { ...this.plan };
  }
}