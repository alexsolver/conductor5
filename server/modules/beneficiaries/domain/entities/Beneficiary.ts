// Removida dependência inválida da camada application

export interface BeneficiaryProps {
  name: string;
  email: string;
  document: string;
  tenantId: string;
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

  static create(props: BeneficiaryProps, id: string): Beneficiary {
    return new Beneficiary(
      id,
      props.name,
      props.email,
      props.document,
      props.tenantId
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