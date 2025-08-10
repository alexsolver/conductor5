
export interface TimecardConfiguration {
  standardWorkingHours: number;
  maxOvertimeHours: number;
  autoApprovalThreshold: number;
  notificationSettings: {
    overtimeAlerts: boolean;
    approvalReminders: boolean;
    complianceWarnings: boolean;
  };
  complianceRules: {
    maxConsecutiveWorkDays: number;
    minBreakDuration: number;
    maxShiftLength: number;
  };
}

export class TimecardConfig {
  private static instance: TimecardConfig;
  private config: TimecardConfiguration;

  private constructor() {
    this.config = {
      standardWorkingHours: 8,
      maxOvertimeHours: 4,
      autoApprovalThreshold: 40, // hours per week
      notificationSettings: {
        overtimeAlerts: true,
        approvalReminders: true,
        complianceWarnings: true
      },
      complianceRules: {
        maxConsecutiveWorkDays: 6,
        minBreakDuration: 60, // minutes
        maxShiftLength: 12 // hours
      }
    };
  }

  static getInstance(): TimecardConfig {
    if (!TimecardConfig.instance) {
      TimecardConfig.instance = new TimecardConfig();
    }
    return TimecardConfig.instance;
  }

  getConfig(): TimecardConfiguration {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TimecardConfiguration>): void {
    this.config = { ...this.config, ...updates };
  }
}
