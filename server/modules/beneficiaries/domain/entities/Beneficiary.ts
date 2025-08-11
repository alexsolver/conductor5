/**
 * Beneficiary Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities
 */

export class Beneficiary {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private firstName: string,
    private lastName: string,
    private email?: string,
    private phone?: string,
    private customerId?: string,
    private relationshipType?: string,
    private active: boolean = true,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getFirstName(): string { return this.firstName; }
  getLastName(): string { return this.lastName; }
  getEmail(): string | undefined { return this.email; }
  getPhone(): string | undefined { return this.phone; }
  getCustomerId(): string | undefined { return this.customerId; }
  getRelationshipType(): string | undefined { return this.relationshipType; }
  isActive(): boolean { return this.active; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateContactInfo(email?: string, phone?: string): void {
    this.email = email;
    this.phone = phone;
    this.updatedAt = new Date();
  }

  updateRelationship(relationshipType: string): void {
    this.relationshipType = relationshipType;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}