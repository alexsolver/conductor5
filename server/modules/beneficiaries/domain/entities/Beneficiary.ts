// Domain entities should not import DTOs from application layer

// Removed application layer import - domain should not depend on application

export interface BeneficiaryProps {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _email: string,
    private readonly _phone?: string,
    private readonly _address?: string,
    private readonly _createdAt: Date = new Date(),
    private readonly _updatedAt: Date = new Date()
  ) {}

  static create(props: BeneficiaryProps): Beneficiary {
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

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get phone(): string | undefined { return this._phone; }
  get address(): string | undefined { return this._address; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      phone: this._phone,
      address: this._address,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}