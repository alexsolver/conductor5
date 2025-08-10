
export interface BeneficiaryConfiguration {
  maxBeneficiariesPerCustomer: number;
  documentExpirationWarningDays: number;
  autoSuspendInactiveDays: number;
  requireDocumentVerification: boolean;
  allowDuplicateDocuments: boolean;
  statusTransitionRules: {
    [key: string]: string[];
  };
}

export class BeneficiaryConfig {
  private static instance: BeneficiaryConfig;
  private config: BeneficiaryConfiguration;

  private constructor() {
    this.config = {
      maxBeneficiariesPerCustomer: parseInt(process.env.MAX_BENEFICIARIES_PER_CUSTOMER || '100'),
      documentExpirationWarningDays: parseInt(process.env.DOCUMENT_EXPIRATION_WARNING_DAYS || '30'),
      autoSuspendInactiveDays: parseInt(process.env.AUTO_SUSPEND_INACTIVE_DAYS || '365'),
      requireDocumentVerification: process.env.REQUIRE_DOCUMENT_VERIFICATION === 'true',
      allowDuplicateDocuments: process.env.ALLOW_DUPLICATE_DOCUMENTS === 'true',
      statusTransitionRules: {
        pending: ['active', 'inactive'],
        active: ['inactive', 'suspended'],
        inactive: ['active', 'suspended'],
        suspended: ['active', 'inactive']
      }
    };
  }

  static getInstance(): BeneficiaryConfig {
    if (!BeneficiaryConfig.instance) {
      BeneficiaryConfig.instance = new BeneficiaryConfig();
    }
    return BeneficiaryConfig.instance;
  }

  getConfig(): BeneficiaryConfiguration {
    return { ...this.config };
  }

  updateConfig(updates: Partial<BeneficiaryConfiguration>): void {
    this.config = { ...this.config, ...updates };
  }

  canTransitionStatus(fromStatus: string, toStatus: string): boolean {
    const allowedTransitions = this.config.statusTransitionRules[fromStatus];
    return allowedTransitions ? allowedTransitions.includes(toStatus) : false;
  }
}
