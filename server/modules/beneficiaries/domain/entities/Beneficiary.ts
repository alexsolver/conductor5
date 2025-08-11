// Domain entities should not import DTOs from application layer

// Removed application layer dependency - domain should not import from application

// CLEAN ARCHITECTURE: DTOs and data interfaces removed from domain entity
// These concerns belong to application/presentation layer

export class Beneficiary {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _email: string,
    private readonly _phone?: string,
    private readonly _address?: string,
    private readonly _createdAt: Date = new Date(),
    private readonly _modifiedAt: Date = new Date()
  ) {}

  // Factory method removed - should be handled by repository or service layer
  // Domain entities should focus on business logic, not object construction

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get phone(): string | undefined { return this._phone; }
  get address(): string | undefined { return this._address; }
  get createdAt(): Date { return this._createdAt; }
  get modifiedAt(): Date { return this._modifiedAt; }

  // CLEANED: Serialization methods removed from domain entities
  // Presentation concerns should be handled by DTOs in application layer
}