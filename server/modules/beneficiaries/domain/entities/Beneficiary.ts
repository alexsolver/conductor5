// Domain entities should not depend on DTOs

export interface BeneficiaryProps {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Beneficiary {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(props: Omit<BeneficiaryProps, 'id' | 'createdAt' | 'updatedAt'>): Beneficiary {
    return new Beneficiary(
      crypto.randomUUID(),
      props.name,
      props.email,
      props.phone,
      props.address
    );
  }

  static reconstruct(props: BeneficiaryProps): Beneficiary {
    return new Beneficiary(
      props.id,
      props.name,
      props.email,
      props.phone,
      props.address,
      props.createdAt,
      props.updatedAt
    );
  }

  update(props: Partial<Pick<BeneficiaryProps, 'name' | 'email' | 'phone' | 'address'>>): Beneficiary {
    return new Beneficiary(
      this.id,
      props.name ?? this.name,
      props.email ?? this.email,
      props.phone ?? this.phone,
      props.address ?? this.address,
      this.createdAt,
      new Date()
    );
  }
}