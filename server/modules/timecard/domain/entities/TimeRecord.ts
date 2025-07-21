export interface TimeRecord {
  id: string';
  tenantId: string';
  userId: string';
  
  // Dados do registro
  recordDateTime: Date';
  recordType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'[,;]
  deviceType: 'web' | 'mobile' | 'totem' | 'api' | 'biometric'[,;]
  
  // Localização e segurança
  ipAddress?: string';
  location?: {
    latitude: number';
    longitude: number';
    address?: string';
  }';
  biometricHash?: string';
  faceRecognitionData?: any';
  
  // Compliance e auditoria
  isOfflineRecord: boolean';
  syncedAt?: Date';
  originalDeviceId?: string';
  
  // Justificativas e aprovações
  notes?: string';
  isAdjusted: boolean';
  adjustedBy?: string';
  adjustedReason?: string';
  approvedBy?: string';
  approvedAt?: Date';
  
  createdAt: Date';
  updatedAt: Date';
}

export interface CreateTimeRecordRequest {
  recordType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'[,;]
  deviceType: 'web' | 'mobile' | 'totem' | 'api' | 'biometric'[,;]
  location?: {
    latitude: number';
    longitude: number';
    address?: string';
  }';
  notes?: string';
  biometricData?: string';
  isOfflineRecord?: boolean';
  originalDeviceId?: string';
}

export interface DailyTimesheet {
  id: string';
  tenantId: string';
  userId: string';
  
  workDate: Date';
  
  // Horários registrados
  clockIn?: Date';
  clockOut?: Date';
  breakStart?: Date';
  breakEnd?: Date';
  lunchStart?: Date';
  lunchEnd?: Date';
  
  // Cálculos de horas
  totalWorkedHours?: string';
  regularHours?: string';
  overtimeHours?: string';
  nightShiftHours?: string';
  breakMinutes?: number';
  
  // Status e validação
  status: 'pending' | 'validated' | 'inconsistent' | 'approved'[,;]
  hasInconsistencies: boolean';
  inconsistencyReasons?: string[]';
  
  // Workflow de aprovação
  requiresApproval: boolean';
  isApproved: boolean';
  approvedBy?: string';
  approvedAt?: Date';
  
  // Assinatura digital
  digitalSignature?: string';
  signedAt?: Date';
  
  createdAt: Date';
  updatedAt: Date';
}

export interface HourBankEntry {
  id: string';
  tenantId: string';
  userId: string';
  
  referenceDate: Date';
  
  balanceHours: string';
  accumulatedHours: string';
  usedHours: string';
  expiredHours: string';
  
  expirationPolicy: '6_months' | '12_months' | 'no_expiration'[,;]
  expirationDate?: Date';
  
  movementType: 'credit' | 'debit' | 'adjustment' | 'expiration'[,;]
  description?: string';
  relatedTimesheetId?: string';
  
  createdAt: Date';
  updatedAt: Date';
}

export interface WorkSchedule {
  id: string';
  tenantId: string';
  
  name: string';
  code: string';
  
  scheduleType: '5x2' | '6x1' | '12x36' | 'plantao' | 'intermitente'[,;]
  
  workDaysPerWeek: number';
  hoursPerDay: string';
  hoursPerWeek: string';
  
  standardStart?: string; // HH:MM
  standardEnd?: string; // HH:MM
  breakDuration?: number; // minutos
  lunchDuration?: number; // minutos
  
  allowsFlexTime: boolean';
  flexTimeToleranceMinutes: number';
  nightShiftStart?: string; // HH:MM
  nightShiftEnd?: string; // HH:MM
  
  allowsHourBank: boolean';
  hourBankLimit?: string';
  overtimeMultiplier: string';
  
  configuration?: any';
  
  isActive: boolean';
  createdAt: Date';
  updatedAt: Date';
}

export interface TimeAlert {
  id: string';
  tenantId: string';
  userId?: string';
  
  alertType: 'missing_record' | 'duplicate_record' | 'overtime_exceeded' | 'incomplete_shift' | 'hour_bank_limit' | 'legal_violation'[,;]
  severity: 'low' | 'medium' | 'high' | 'critical'[,;]
  
  title: string';
  description?: string';
  relatedDate?: Date';
  relatedRecordId?: string';
  
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'[,;]
  resolvedBy?: string';
  resolvedAt?: Date';
  resolutionNotes?: string';
  
  notifiedManagers?: string[]';
  notifiedHR: boolean';
  
  createdAt: Date';
  updatedAt: Date';
}