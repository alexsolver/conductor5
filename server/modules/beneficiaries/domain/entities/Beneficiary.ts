// Domain entities should not import DTOs from application layer

export interface BeneficiaryProps {
  name: string;
  email: string;
  document: string;
  tenantId: string;
}

export interface BeneficiaryCreateData {
  id?: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

export class Beneficiary {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public document: string,
    public readonly tenantId: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: string;
    tenantId: string;
    createdBy?: string;
  }): Beneficiary {
    return new Beneficiary(
      crypto.randomUUID(),
      data.name,
      data.email,
      data.document,
      data.tenantId
    );
  }

  update(props: Partial<BeneficiaryProps>): void {
    if (props.name !== undefined) this.name = props.name;
    if (props.email !== undefined) this.email = props.email;
    if (props.document !== undefined) this.document = props.document;
    this.updatedAt = new Date();
  }

  validate(): boolean {
    return !!(this.name && this.email && this.document && this.tenantId);
  }
}