// Domain entities should not import DTOs from application layer

// Removed application layer dependency - domain should not import from application

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

  // Factory method removed - should be handled by repository or service layer
  // Domain entities should focus on business logic, not object construction

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get phone(): string | undefined { return this._phone; }
  get address(): string | undefined { return this._address; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // CLEANED: Serialization methods removed from domain entities
  // Presentation concerns should be handled by DTOs in application layer
}