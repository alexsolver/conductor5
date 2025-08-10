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

// Domain puro - sem dependências externas
export class Beneficiary {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public tenantId: string
  ) {}

  // Factory method usando primitivos
  static create(
    id: string,
    name: string,
    email: string,
    tenantId: string
  ): Beneficiary {
    return new Beneficiary(id, name, email, tenantId);
  }

  // Validação no domain
  validate(): boolean {
    return !!(this.name && this.email && this.tenantId);
  }

  static reconstruct(props: BeneficiaryProps): Beneficiary {
    return new Beneficiary(
      props.id,
      props.name,
      props.email,
      props.tenantId, // Assuming tenantId would be part of BeneficiaryProps in a real scenario
      props.phone,
      props.createdAt,
      props.updatedAt
    );
  }

  update(props: Partial<Pick<BeneficiaryProps, 'name' | 'email' | 'phone' | 'address'>>): Beneficiary {
    return new Beneficiary(
      this.id,
      props.name ?? this.name,
      props.email ?? this.email,
      this.tenantId, // Keep tenantId
      props.phone ?? this.phone,
      this.createdAt,
      new Date()
    );
  }
}