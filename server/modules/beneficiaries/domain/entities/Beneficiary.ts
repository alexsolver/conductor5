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

export interface BeneficiaryData {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  tenantId: string;
  customerId?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Beneficiary {
  constructor(data: BeneficiaryData) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name;
    this.email = data.email;
    this.document = data.document;
    this.tenantId = data.tenantId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static create(data: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: string;
    tenantId: string;
    createdBy?: string;
  }): Beneficiary {
    return new Beneficiary({
      name: data.name,
      email: data.email,
      document: data.document,
      tenantId: data.tenantId,
    });
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