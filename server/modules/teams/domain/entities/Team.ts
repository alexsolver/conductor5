/**
 * Team Domain Entity - Phase 10 Implementation
 * 
 * Representa uma equipe no domínio do sistema Conductor
 * Entidade pura sem dependências externas
 * 
 * @module TeamEntity
 * @version 1.0.0
 * @created 2025-08-12 - Phase 10 Clean Architecture Implementation
 */

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  teamType: 'support' | 'technical' | 'sales' | 'management' | 'external';
  status: 'active' | 'inactive' | 'suspended';
  managerId?: string;
  departmentId?: string;
  location?: string;
  maxMembers?: number;
  workingHours?: {
    startTime: string;
    endTime: string;
    timezone: string;
    workDays: number[];
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    slackChannel?: string;
  };
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class TeamEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public description: string | null = null,
    public teamType: 'support' | 'technical' | 'sales' | 'management' | 'external' = 'support',
    public status: 'active' | 'inactive' | 'suspended' = 'active',
    public managerId: string | null = null,
    public departmentId: string | null = null,
    public location: string | null = null,
    public maxMembers: number | null = null,
    public workingHours: {
      startTime: string;
      endTime: string;
      timezone: string;
      workDays: number[];
    } | null = null,
    public contactInfo: {
      email?: string;
      phone?: string;
      slackChannel?: string;
    } | null = null,
    public metadata: Record<string, any> | null = null,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public readonly createdBy: string | null = null,
    public updatedBy: string | null = null
  ) {
    this.validateName();
    this.validateTenantId();
    this.validateTeamType();
    this.validateWorkingHours();
  }

  private validateName(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Nome da equipe é obrigatório');
    }
    if (this.name.length > 255) {
      throw new Error('Nome da equipe deve ter no máximo 255 caracteres');
    }
  }

  private validateTenantId(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório');
    }
  }

  private validateTeamType(): void {
    const validTypes = ['support', 'technical', 'sales', 'management', 'external'];
    if (!validTypes.includes(this.teamType)) {
      throw new Error('Tipo de equipe inválido');
    }
  }

  private validateWorkingHours(): void {
    if (this.workingHours) {
      const { startTime, endTime, workDays } = this.workingHours;
      
      // Validar formato de horário
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new Error('Formato de horário inválido (use HH:MM)');
      }
      
      // Validar dias de trabalho
      if (!workDays || workDays.length === 0) {
        throw new Error('Pelo menos um dia de trabalho deve ser especificado');
      }
      
      if (workDays.some(day => day < 0 || day > 6)) {
        throw new Error('Dias de trabalho devem estar entre 0 (domingo) e 6 (sábado)');
      }
    }
  }

  updateName(newName: string, updatedBy?: string): void {
    this.name = newName;
    this.validateName();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateDescription(newDescription: string | null, updatedBy?: string): void {
    this.description = newDescription;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateTeamType(newType: 'support' | 'technical' | 'sales' | 'management' | 'external', updatedBy?: string): void {
    this.teamType = newType;
    this.validateTeamType();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateStatus(newStatus: 'active' | 'inactive' | 'suspended', updatedBy?: string): void {
    this.status = newStatus;
    this.isActive = newStatus === 'active';
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  assignManager(managerId: string | null, updatedBy?: string): void {
    this.managerId = managerId;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateWorkingHours(workingHours: {
    startTime: string;
    endTime: string;
    timezone: string;
    workDays: number[];
  } | null, updatedBy?: string): void {
    this.workingHours = workingHours;
    this.validateWorkingHours();
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  updateContactInfo(contactInfo: {
    email?: string;
    phone?: string;
    slackChannel?: string;
  } | null, updatedBy?: string): void {
    this.contactInfo = contactInfo;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  deactivate(updatedBy?: string): void {
    this.isActive = false;
    this.status = 'inactive';
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  activate(updatedBy?: string): void {
    this.isActive = true;
    this.status = 'active';
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  suspend(updatedBy?: string): void {
    this.status = 'suspended';
    this.isActive = false;
    this.updatedAt = new Date();
    if (updatedBy) this.updatedBy = updatedBy;
  }

  static create(data: {
    tenantId: string;
    name: string;
    description?: string;
    teamType?: 'support' | 'technical' | 'sales' | 'management' | 'external';
    managerId?: string;
    departmentId?: string;
    location?: string;
    maxMembers?: number;
    workingHours?: {
      startTime: string;
      endTime: string;
      timezone: string;
      workDays: number[];
    };
    contactInfo?: {
      email?: string;
      phone?: string;
      slackChannel?: string;
    };
    metadata?: Record<string, any>;
    createdBy?: string;
  }): TeamEntity {
    const generateId = () => {
      return 'team_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    };
    
    return new TeamEntity(
      generateId(),
      data.tenantId,
      data.name,
      data.description || null,
      data.teamType || 'support',
      'active',
      data.managerId || null,
      data.departmentId || null,
      data.location || null,
      data.maxMembers || null,
      data.workingHours || null,
      data.contactInfo || null,
      data.metadata || null,
      true,
      new Date(),
      new Date(),
      data.createdBy || null,
      null
    );
  }
}