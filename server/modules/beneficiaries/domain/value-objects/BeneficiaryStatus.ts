
export enum BeneficiaryStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export class BeneficiaryStatus {
  constructor(private readonly value: BeneficiaryStatusEnum) {
    if (!Object.values(BeneficiaryStatusEnum).includes(value)) {
      throw new Error(`Invalid beneficiary status: ${value}`);
    }
  }

  getValue(): BeneficiaryStatusEnum {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: BeneficiaryStatus): boolean {
    return this.value === other.value;
  }

  isActive(): boolean {
    return this.value === BeneficiaryStatusEnum.ACTIVE;
  }

  static create(status: string): BeneficiaryStatus {
    return new BeneficiaryStatus(status as BeneficiaryStatusEnum);
  }

  static active(): BeneficiaryStatus {
    return new BeneficiaryStatus(BeneficiaryStatusEnum.ACTIVE);
  }

  static inactive(): BeneficiaryStatus {
    return new BeneficiaryStatus(BeneficiaryStatusEnum.INACTIVE);
  }
}
