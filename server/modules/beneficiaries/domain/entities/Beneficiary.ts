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
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Domain com factory method puro
  static create(
    id: string,
    tenantId: string,
    name: string,
    email: string,
    phone?: string
  ): Beneficiary {
    return new Beneficiary(id, tenantId, name, email, phone);
  }

  // Domain validation
  isValid(): boolean {
    return this.name.length > 0 && this.email.includes('@');
  }
}